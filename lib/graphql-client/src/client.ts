import debug from "debug";
import {
  DEFAULT_MAX_RETRIES,
  DEFAULT_RETRY_AFTER_MS,
  adminApiHostname,
  graphqlApiDomain,
} from "./constants";
import type {
  GraphQLClientConfig,
  FetcherRequestInit,
  ComplexityConfig,
} from "./types/config";
import {
  BigCommerceGraphQLError,
  RateLimitError,
  ComplexityLimitError,
} from "./types/errors";
import {
  AppExtension,
  AppExtensionContext,
  AppExtensionLabel,
  AppExtensionModel,
  ProductLocaleQueryOptions,
  ProductLocaleUpdateOptions,
} from "./types";
import { productQueries } from "./queries";
import {
  GetAppExtensionsDocument,
  CreateAppExtensionDocument,
  UpdateAppExtensionDocument,
  DeleteAppExtensionDocument,
  createAppExtensionInput,
  updateAppExtensionInput,
} from "./queries/app-extension.tada";
import {
  GetAllProductsDocument,
  GetProductLocaleDataDocument,
  createGetAllProductsVariables,
  createGetProductLocaleDataVariables,
} from "./queries/product.tada";
import { graphql } from "./graphql";
import type { ResultOf, VariablesOf } from "./graphql";
import type { GraphQLResponse } from "./types/graphql";
import { DocumentNode, parse, print } from "graphql";
import { UpdateProductLocaleDataDocument } from "./queries/product.tada";
import { formatChannelId, formatProductId } from "./utils";

export class GraphQLClient {
  private baseUrl: string;
  private headers: Headers;
  private maxRetries: number;
  private failOnLimitReached: boolean;
  private logger: debug.Debugger;
  private beforeRequest?: GraphQLClientConfig["beforeRequest"];
  private afterResponse?: GraphQLClientConfig["afterResponse"];
  private complexityConfig?: ComplexityConfig;

  constructor({
    accessToken,
    storeHash,
    maxRetries = DEFAULT_MAX_RETRIES,
    failOnLimitReached = false,
    apiDomain = graphqlApiDomain,
    apiHostname = adminApiHostname,
    beforeRequest,
    afterResponse,
    complexity,
  }: GraphQLClientConfig) {
    this.baseUrl = `https://${apiHostname}/stores/${storeHash}/graphql`;
    this.headers = new Headers({
      "X-Auth-Token": accessToken,
      Accept: "application/json",
      "Content-Type": "application/json",
    });
    this.maxRetries = maxRetries;
    this.failOnLimitReached = failOnLimitReached;
    this.beforeRequest = beforeRequest;
    this.afterResponse = afterResponse;
    this.complexityConfig = complexity;
    this.logger = debug("bigcommerce:graphql");

    this.logger("Client initialized:", {
      storeHash,
      hasAccessToken: !!accessToken,
      maxRetries,
      failOnLimitReached,
      apiDomain,
      apiHostname,
      hasComplexityConfig: !!complexity,
    });
  }

  private createError(
    message: string,
    response: Response,
    data?: any
  ): BigCommerceGraphQLError {
    const error = new Error(message) as BigCommerceGraphQLError;
    error.response = response;
    error.status = response.status;

    if (data?.errors) {
      error.errors = data.errors;
    }

    return error;
  }

  private handleComplexityHeader(requestId: string, response: Response): void {
    if (!this.complexityConfig) return;

    const complexity = parseInt(
      response.headers.get('x-bc-graphql-complexity') || "0",
      10
    );

    this.logger("[%s] Complexity:", requestId, { complexity });

    // Notify via callback if configured
    if (this.complexityConfig.onComplexityUpdate) {
      this.complexityConfig.onComplexityUpdate(complexity);
    }
  }

  private async handleRateLimit(
    requestId: string,
    response: Response,
    retryCount: number = 0
  ): Promise<void> {
    const retryAfterMs = parseInt(
      response.headers.get("X-Rate-Limit-Time-Reset-Ms") ||
        String(DEFAULT_RETRY_AFTER_MS),
      10
    );

    // Get quota information from headers
    const quota = response.headers.get("X-Rate-Limit-Requests-Quota");
    const remaining = response.headers.get("X-Rate-Limit-Requests-Left");
    const timeWindow = response.headers.get("X-Rate-Limit-Time-Window-Ms");

    this.logger("[%s] Hit Rate Limit:", requestId, {
      quota,
      remaining,
      timeWindow,
      retryAfterMs,
      retryCount,
    });

    if (this.failOnLimitReached) {
      const error = new Error(
        `Rate limit reached. Retry after ${Math.ceil(retryAfterMs / 1000)} seconds`
      ) as RateLimitError;
      error.retryAfter = Math.ceil(retryAfterMs / 1000);
      this.logger("[%s] Failing request without retrying since failOnLimitReached is true.", requestId);
      throw error;
    }

    if (retryCount >= this.maxRetries) {
      const error = new Error(
        `Rate limit reached. Max retries (${this.maxRetries}) exceeded.`
      ) as RateLimitError;
      error.retryAfter = Math.ceil(retryAfterMs / 1000);
      this.logger(`[%s] Failing request without retrying since max retries (${this.maxRetries}) exceeded.`, requestId);
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
  }

  private headersToObject(headers: Headers): Record<string, string> {
    const obj: Record<string, string> = {};
    headers.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  private generateRequestId(): string {
    return `req_${Math.random().toString(36).substring(2, 15)}`;
  }

  async request<T>(
    query:
      | string
      | { query: string; variables?: Record<string, any> }
      | ReturnType<typeof graphql>,
    variables: Record<string, any> = {},
    retryCount: number = 0
  ): Promise<GraphQLResponse<T>> {
    const requestId = this.generateRequestId();
    const queryStr =
      typeof query === "string"
        ? query
        : "raw" in query
        ? query.raw
        : query.query;
    const vars =
      typeof query === "string"
        ? variables
        : { ...("variables" in query ? query.variables : {}), ...variables };

    let requestInit: RequestInit = {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        query: queryStr,
        variables: vars,
      }),
      redirect: "follow",
    };

    // Apply beforeRequest hook if defined
    if (this.beforeRequest) {
      const modifiedOptions = await this.beforeRequest(
        requestInit as FetcherRequestInit
      );
      if (modifiedOptions) {
        requestInit = {
          ...requestInit,
          ...modifiedOptions,
          body: JSON.stringify(modifiedOptions.body || requestInit.body),
        };
      }
    }

    this.logger("[%s] Request Query: %j", requestId, queryStr);
    this.logger("[%s] Request Variables: %j", requestId, vars);

    const response = await fetch(this.baseUrl, requestInit);

    // Apply onComplexityUpdate callback if defined
    this.handleComplexityHeader(requestId, response);

    // Apply afterResponse hook if defined
    if (this.afterResponse) {
      await this.afterResponse(response);
    }

    this.logger(
      `[%s] Response Status:`,
      requestId,
      `${response.status} ${response.statusText}`
    );
    this.logger(
      `[%s] Response Headers: %j`,
      requestId,
      this.headersToObject(response.headers)
    );
    this.logger(
      `[%s] Response Body: %j`,
      requestId,
      await response.clone().json()
    );

    // Handle rate limiting
    if (response.status === 429) {
      await this.handleRateLimit(requestId, response, retryCount);
      return this.request(query, variables, retryCount + 1);
    }

    if (!response.ok) {
      throw this.createError(
        `HTTP ${response.status} ${response.statusText}`,
        response
      );
    }

    const data = await response.json();

    // Handle GraphQL errors
    if (data.errors?.length > 0) {
      const error = this.createError(data.errors[0].message, response, data);
      this.logger("[%s] Errors: %j", requestId, data.errors);
      throw error;
    }

    return data as GraphQLResponse<T>;
  }

  // App Extensions
  async getAppExtensions(): Promise<AppExtension[]> {
    type Response = ResultOf<typeof GetAppExtensionsDocument>;
    const response = await this.request<Response>({
      query: GetAppExtensionsDocument.toString(),
    });
    const data = response.data;
    const edges = data.store.appExtensions?.edges;
    if (!edges) return [];
    return edges
      .map((edge) => edge?.node)
      .filter((node): node is NonNullable<typeof node> => node !== null)
      .map((node) => ({
        ...node,
        context: node.context || null,
        model: node.model || null,
      }));
  }

  async createAppExtension(params: {
    context: AppExtensionContext;
    model: AppExtensionModel;
    url: string;
    label: AppExtensionLabel;
  }): Promise<string> {
    const variables = createAppExtensionInput(params);
    type Response = ResultOf<typeof CreateAppExtensionDocument>;
    const response = await this.request<Response>(
      { query: CreateAppExtensionDocument.toString() },
      variables
    );
    const data = response.data;
    const extension = data.appExtension?.createAppExtension?.appExtension;
    if (!extension?.id) {
      throw new Error("Failed to create app extension");
    }
    return extension.id;
  }

  async updateAppExtension(params: {
    id: string;
    input: { label: AppExtensionLabel };
  }): Promise<AppExtension> {
    const variables = updateAppExtensionInput({
      id: params.id,
      label: params.input.label,
    });
    type Response = ResultOf<typeof UpdateAppExtensionDocument>;
    const response = await this.request<Response>(
      { query: UpdateAppExtensionDocument.toString() },
      variables
    );
    const data = response.data;
    const extension = data.appExtension?.updateAppExtension?.appExtension;
    if (!extension) {
      throw new Error("Failed to update app extension");
    }
    return {
      ...extension,
      context: extension.context || null,
      model: extension.model || null,
    };
  }

  async deleteAppExtension(id: string): Promise<string> {
    type Response = ResultOf<typeof DeleteAppExtensionDocument>;
    const response = await this.request<Response>(
      { query: DeleteAppExtensionDocument.toString() },
      { id }
    );
    const data = response.data;
    const deletedId =
      data.appExtension?.deleteAppExtension?.deletedAppExtensionId;
    if (!deletedId) {
      throw new Error("Failed to delete app extension");
    }
    return deletedId;
  }

  async upsertAppExtension(params: {
    context: AppExtensionContext;
    model: AppExtensionModel;
    url: string;
    label: AppExtensionLabel;
  }): Promise<string> {
    try {
      const extensions = await this.getAppExtensions();
      const existingExtension = extensions.find(
        (ext) => ext.context === params.context && ext.model === params.model
      );

      if (existingExtension) {
        await this.updateAppExtension({
          id: existingExtension.id,
          input: { label: params.label },
        });
        return existingExtension.id;
      } else {
        return await this.createAppExtension(params);
      }
    } catch (error) {
      this.logger("Error in upsertAppExtension:", error);
      throw error;
    }
  }

  // Product Methods
  async getProductLocaleData(options: ProductLocaleQueryOptions) {
    type Response = ResultOf<typeof GetProductLocaleDataDocument>;
    type ProductType = NonNullable<Response["store"]>["product"];

    const variables = createGetProductLocaleDataVariables({
      pid: options.pid,
      channelId: options.channelId,
      locale: options.locale,
    });

    const response = await this.request({
      query: print(GetProductLocaleDataDocument),
      variables,
    });
    const typedResponse = response as unknown as {
      data: { store: { product: ProductType } };
    };

    if (!typedResponse.data?.store?.product) {
      throw new Error("Product not found");
    }
    return typedResponse.data.store.product;
  }

  async NOTADA_updateProductLocaleData(variables: any) {
    return this.request(productQueries.hardcodedQuery_updateProductLocaleData(variables));
  }

  async updateProductLocaleData(options: ProductLocaleUpdateOptions) {
    type Response = ResultOf<typeof UpdateProductLocaleDataDocument>;
    type ProductType = NonNullable<Response["product"]>;

    const productId = formatProductId(options.productId);
    const channelId = formatChannelId(options.channelId);
    const locale = options.locale;

    const basicInput = {
      productId,
      localeContext: {
        channelId,
        locale
      },
      data: {
        name: options.productData?.name,
        description: options.productData?.description,
      }
    }
    const hasBasicInput = Boolean(options.productData?.name || options.productData?.description);

    const seoInput = {
      productId,
      localeContext: {
        channelId,
        locale
      },
      data: {
        pageTitle: options.productData?.pageTitle,
        metaDescription: options.productData?.metaDescription,
      }
    }
    const hasSeoInput = Boolean(options.productData?.pageTitle || options.productData?.metaDescription);

    const preOrderInput = {
      productId,
      localeContext: {
        channelId,
        locale
      },
      data: {
        message: options.productData?.preOrderMessage,
      }
    }
    const hasPreOrderInput = Boolean(options.productData?.preOrderMessage);

    const storefrontInput = {
      productId,
      localeContext: {
        channelId,
        locale
      },
      data: {
        warranty: options.productData?.warranty,
        availabilityDescription: options.productData?.availabilityDescription,
        searchKeywords: options.productData?.searchKeywords,
      }
    }
    const hasStorefrontInput = Boolean(
      options.productData?.warranty || 
      options.productData?.availabilityDescription || 
      options.productData?.searchKeywords
    );

    const optionsInput = {
      productId,
      localeContext: {
        channelId,
        locale
      },
      data: { options: options.productData?.options || [] }
    }
    const hasOptionsInput = Boolean(options.productData?.options?.length);

    const modifiersInput = {
      productId,
      localeContext: {
        channelId,
        locale
      },
      data: { modifiers: options.productData?.modifiers || [] }
    }
    const hasModifiersInput = Boolean(options.productData?.modifiers?.length);

    const customFieldsInput = {
      productId,
      data: options.productData?.customFields || []
    }
    const hasCustomFieldsInput = Boolean(options.productData?.customFields?.length);

    const variables = {
      productId: formatProductId(options.productId),
      channelId: formatChannelId(options.channelId),
      locale: options.locale,
      basicInput,
      hasBasicInput,
      seoInput,
      hasSeoInput,
      preOrderInput,
      hasPreOrderInput,
      storefrontInput,
      hasStorefrontInput,
      optionsInput,
      hasOptionsInput,
      modifiersInput,
      hasModifiersInput,
      customFieldsInput,
      hasCustomFieldsInput,
    };

    const response = await this.request({
      query: print(UpdateProductLocaleDataDocument),
      variables,
    });
    const typedResponse = response as unknown as {
      data: { store: { product: ProductType } };
    };

    if (!typedResponse.data?.store?.product) {
      throw new Error("Product not found");
    }
    return typedResponse.data.store.product;
  }

  async getAllProducts(limit: number, cursor?: string) {
    type Response = ResultOf<typeof GetAllProductsDocument>;
    type ProductsType = NonNullable<Response["store"]>["products"];

    const variables = createGetAllProductsVariables({ limit, cursor });
    const response = await this.request(
      { query: GetAllProductsDocument.toString() },
      variables
    );
    const typedResponse = response as unknown as {
      data: { site: { products: ProductsType } };
    };

    if (!typedResponse.data?.site?.products) {
      return {
        pageInfo: { hasNextPage: false, endCursor: null },
        edges: [],
      };
    }
    return typedResponse.data.site.products;
  }
}
