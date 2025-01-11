import debug from 'debug';
import type { GraphQLClientConfig } from './types';
import {
  AppExtension,
  AppExtensionContext,
  AppExtensionLabel,
  AppExtensionModel,
  ProductLocaleQueryOptions,
  ProductLocaleMutationOptions
} from './types';
import { appExtensionQueries, productQueries } from './queries';

export class GraphQLClient {
  private baseUrl: string;
  private headers: Headers;
  private maxRetries: number;
  private failOnLimitReached: boolean;
  private logger: debug.Debugger;

  constructor({ accessToken, storeHash, maxRetries = 3, failOnLimitReached = false }: GraphQLClientConfig) {
    this.baseUrl = `https://api.bigcommerce.com/stores/${storeHash}/graphql`;
    this.headers = new Headers({
      'X-Auth-Token': accessToken,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    });
    this.maxRetries = maxRetries;
    this.failOnLimitReached = failOnLimitReached;
    this.logger = debug('bigcommerce:graphql');

    this.logger('Initialized BigCommerce GraphQL client:', {
      storeHash,
      hasAccessToken: !!accessToken,
      maxRetries,
      failOnLimitReached
    });
  }

  private async handleRateLimit(retryCount: number = 0, retryAfterMs: number = 30000): Promise<void> {
    if (this.failOnLimitReached) {
      const error = new Error(`Rate limit reached. Retry after ${Math.ceil(retryAfterMs / 1000)} seconds`);
      (error as any).retryAfter = Math.ceil(retryAfterMs / 1000);
      this.logger('Rate limit reached, failing request:', error);
      throw error;
    }

    if (retryCount >= this.maxRetries) {
      const error = new Error(`Rate limit reached. Max retries (${this.maxRetries}) exceeded.`);
      this.logger('Rate limit reached, max retries exceeded:', error);
      throw error;
    }

    this.logger('Rate limit info:', { retryCount, retryAfterMs });

    console.warn(
      `Rate limit reached. Retrying after ${Math.ceil(retryAfterMs / 1000)} seconds. ` +
      `Attempt ${retryCount + 1}/${this.maxRetries}`
    );
    
    await new Promise(resolve => setTimeout(resolve, retryAfterMs));
  }

  private lastQuery: string = "";
  private lastVariables: Record<string, any> = {};

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
    this.lastQuery = typeof query === 'string' ? query : query.query;
    this.lastVariables = typeof query === 'string' ? variables : query.variables || {};

    const requestOptions = {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        query: this.lastQuery,
        variables: this.lastVariables,
      }),
      redirect: 'follow' as RequestRedirect,
    };

    this.logger('Making GraphQL request:', {
      query: this.lastQuery.replace(/\s+/g, ' ').trim(),
      variables,
      headers: this.headersToObject(this.headers)
    });

    const response = await fetch(this.baseUrl, requestOptions);

    this.logger('Received GraphQL response:', {
      status: response.status,
      statusText: response.statusText,
      headers: this.headersToObject(response.headers)
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfterMs = parseInt(response.headers.get('X-Rate-Limit-Time-Reset-Ms') || '30000', 10);
      
      // Log remaining quota information
      const quota = response.headers.get("X-Rate-Limit-Requests-Quota");
      const remaining = response.headers.get("X-Rate-Limit-Requests-Left");
      const timeWindow = response.headers.get("X-Rate-Limit-Time-Window-Ms");

      this.logger('GraphQL Rate Limits:', {
        quota,
        remaining,
        timeWindow,
        retryAfterMs
      });

      await this.handleRateLimit(retryCount, retryAfterMs);
      return this.request(query, variables, retryCount + 1);
    }

    const data = await response.json();

    // Handle GraphQL errors
    if (typeof data === 'object' && data && 'errors' in data) {
      const error = new Error((data.errors as any[])[0].message);
      (error as any).errors = data.errors;
      this.logger('GraphQL errors:', data.errors);
      throw error;
    }

    this.logger('GraphQL request successful:', {
      hasData: !!data.data,
      dataKeys: data.data ? Object.keys(data.data) : []
    });

    return data;
  }

  // App Extensions
  async getAppExtensions(): Promise<AppExtension[]> {
    const response = await this.request(appExtensionQueries.getAppExtensions());
    return response.data.store.appExtensions.edges.map((edge: any) => edge.node);
  }

  async createAppExtension(params: {
    context: AppExtensionContext;
    model: AppExtensionModel;
    url: string;
    label: AppExtensionLabel;
  }): Promise<string> {
    const response = await this.request(appExtensionQueries.createAppExtension(params));
    return response.data.appExtension.createAppExtension.appExtension.id;
  }

  async updateAppExtension(params: {
    id: string;
    input: { label: AppExtensionLabel };
  }): Promise<AppExtension> {
    const response = await this.request(appExtensionQueries.updateAppExtension(params));
    return response.data.appExtension.updateAppExtension.appExtension;
  }

  async deleteAppExtension(id: string): Promise<string> {
    const response = await this.request(appExtensionQueries.deleteAppExtension(id));
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
        ext => ext.context === params.context && ext.model === params.model
      );

      if (existingExtension) {
        await this.updateAppExtension({
          id: existingExtension.id,
          input: { label: params.label }
        });
        return existingExtension.id;
      } else {
        return await this.createAppExtension(params);
      }
    } catch (error) {
      this.logger('Error in upsertAppExtension:', error);
      throw error;
    }
  }

  // Product Methods
  async getProductLocaleData(options: ProductLocaleQueryOptions) {
    return this.request(productQueries.getProductLocaleData(options));
  }

  async updateProductLocaleData(options: ProductLocaleMutationOptions, variables: any) {
    return this.request(productQueries.updateProductLocaleData(options, variables));
  }
} 