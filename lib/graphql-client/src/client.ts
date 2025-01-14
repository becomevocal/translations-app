import debug from "debug";
import {
  DEFAULT_MAX_RETRIES,
  DEFAULT_RETRY_AFTER_MS,
  GRAPHQL_COMPLEXITY_HEADER,
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
  ProductLocaleMutationOptions,
} from "./types";
import { appExtensionQueries, productQueries } from "./queries";

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

    this.logger("Initialized BigCommerce GraphQL client:", {
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
    this.logger("message:", message);
    this.logger("GraphQL response:", JSON.stringify(response, null, 2));
    this.logger("GraphQL errors:", JSON.stringify(data?.errors, null, 2));

    const error = new Error(message) as BigCommerceGraphQLError;
    error.response = response;
    error.status = response.status;

    if (data?.errors) {
      error.errors = data.errors;
    }

    return error;
  }

  private handleComplexityHeader(response: Response): void {
    if (!this.complexityConfig) return;

    const complexity = parseInt(
      response.headers.get(GRAPHQL_COMPLEXITY_HEADER) || "0",
      10
    );

    this.logger("GraphQL Complexity:", { complexity });

    // Notify via callback if configured
    if (this.complexityConfig.onComplexityUpdate) {
      this.complexityConfig.onComplexityUpdate(complexity);
    }
  }

  private async handleRateLimit(
    retryCount: number = 0,
    retryAfterMs: number = DEFAULT_RETRY_AFTER_MS
  ): Promise<void> {
    if (this.failOnLimitReached) {
      const error = new Error(
        `Rate limit reached. Retry after ${Math.ceil(
          retryAfterMs / 1000
        )} seconds`
      ) as RateLimitError;
      error.retryAfter = Math.ceil(retryAfterMs / 1000);
      this.logger("Rate limit reached, failing request:", error);
      throw error;
    }

    if (retryCount >= this.maxRetries) {
      const error = new Error(
        `Rate limit reached. Max retries (${this.maxRetries}) exceeded.`
      ) as RateLimitError;
      error.retryAfter = Math.ceil(retryAfterMs / 1000);
      this.logger("Rate limit reached, max retries exceeded:", error);
      throw error;
    }

    this.logger("Rate limit info:", { retryCount, retryAfterMs });

    console.warn(
      `Rate limit reached. Retrying after ${Math.ceil(
        retryAfterMs / 1000
      )} seconds. ` + `Attempt ${retryCount + 1}/${this.maxRetries}`
    );

    await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
  }

  private headersToObject(headers: Headers): Record<string, string> {
    const obj: Record<string, string> = {};
    headers.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  async request<T = any>(
    query: string | { query: string; variables?: Record<string, any> },
    variables: Record<string, any> = {},
    retryCount: number = 0
  ): Promise<T> {
    const queryStr = typeof query === "string" ? query : query.query;
    const vars =
      typeof query === "string"
        ? variables
        : { ...query.variables, ...variables };

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

    this.logger("Making GraphQL request:", {
      query: queryStr.replace(/\s+/g, " ").trim(),
      variables: vars,
      headers: this.headersToObject(new Headers(requestInit.headers)),
    });

    const response = await fetch(this.baseUrl, requestInit);

    // Handle complexity tracking
    this.handleComplexityHeader(response);

    // Apply afterResponse hook if defined
    if (this.afterResponse) {
      await this.afterResponse(response);
    }

    this.logger("Received GraphQL response:", {
      status: response.status,
      statusText: response.statusText,
      headers: this.headersToObject(response.headers),
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfterMs = parseInt(
        response.headers.get("X-Rate-Limit-Time-Reset-Ms") ||
          String(DEFAULT_RETRY_AFTER_MS),
        10
      );

      // Log remaining quota information
      const quota = response.headers.get("X-Rate-Limit-Requests-Quota");
      const remaining = response.headers.get("X-Rate-Limit-Requests-Left");
      const timeWindow = response.headers.get("X-Rate-Limit-Time-Window-Ms");

      this.logger("GraphQL Rate Limits:", {
        quota,
        remaining,
        timeWindow,
        retryAfterMs,
      });

      await this.handleRateLimit(retryCount, retryAfterMs);
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
      this.logger("GraphQL errors:", data.errors);
      throw error;
    }

    this.logger("GraphQL request successful:", {
      hasData: !!data.data,
      dataKeys: data.data ? Object.keys(data.data) : [],
    });

    return data;
  }

  // App Extensions
  async getAppExtensions(): Promise<AppExtension[]> {
    const response = await this.request(appExtensionQueries.getAppExtensions());
    return response.data.store.appExtensions.edges.map(
      (edge: any) => edge.node
    );
  }

  async createAppExtension(params: {
    context: AppExtensionContext;
    model: AppExtensionModel;
    url: string;
    label: AppExtensionLabel;
  }): Promise<string> {
    const response = await this.request(
      appExtensionQueries.createAppExtension(params)
    );
    return response.data.appExtension.createAppExtension.appExtension.id;
  }

  async updateAppExtension(params: {
    id: string;
    input: { label: AppExtensionLabel };
  }): Promise<AppExtension> {
    const response = await this.request(
      appExtensionQueries.updateAppExtension(params)
    );
    return response.data.appExtension.updateAppExtension.appExtension;
  }

  async deleteAppExtension(id: string): Promise<string> {
    const response = await this.request(
      appExtensionQueries.deleteAppExtension(id)
    );
    return response.data.appExtension.deleteAppExtension.deletedAppExtensionId;
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
    return this.request(productQueries.getProductLocaleData(options));
  }

  async updateProductLocaleData(variables: any) {
    return this.request(productQueries.updateProductLocaleData(variables));
  }

  async getAllProducts(limit: number, cursor?: string) {
    return this.request(productQueries.getAllProducts({ limit, cursor }));
  }
}
