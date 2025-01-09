interface BigCommerceConfig {
  clientId?: string;
  accessToken?: string;
  storeHash?: string;
  secret?: string;
  callback?: string;
  headers?: Record<string, string>;
  apiUrl?: string;
  loginUrl?: string;
  logLevel?: string;
  failOnLimitReached?: boolean;
  maxRetries?: number;
  timeout?: number;
}

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retryCount?: number;
}

interface StoreInformationResponse {
  id: string;
  account_uuid: string;
  domain: string;
  secure_url: string;
  control_panel_base_url: string;
  status: string;
  name: string;
  first_name: string;
  last_name: string;
  address: string;
  country: string;
  country_code: string;
  phone: string;
  admin_email: string;
  order_email: string;
  favicon_url: string;
  timezone: {
    name: string;
    raw_offset: number;
    dst_offset: number;
    dst_correction: boolean;
    date_format: {
      display: string;
      export: string;
      extended_display: string;
    };
  };
  language: string;
  currency: string;
  currency_symbol: string;
  decimal_separator: string;
  thousands_separator: string;
  decimal_places: number;
  currency_symbol_location: string;
  weight_units: string;
  dimension_units: string;
  dimension_decimal_places: number;
  dimension_decimal_token: string;
  dimension_thousands_token: string;
  plan_name: string;
  plan_level: string;
  plan_is_trial: boolean;
  industry: string;
  logo: {
    url: string;
  } | [];
  is_price_entered_with_tax: boolean;
  store_id: number;
  default_channel_id: number;
  default_site_id: number;
  active_comparison_modules: string[];
  features: {
    stencil_enabled: boolean;
    sitewidehttps_enabled: boolean;
    facebook_catalog_id: string;
    checkout_type: string;
    wishlists_enabled: boolean;
    graphql_storefront_api_enabled: boolean;
    shopper_consent_tracking_enabled: boolean;
    multi_storefront_enabled: boolean;
    multi_language_enabled: boolean;
    storefront_limits: {
      active: number;
      total_including_inactive: number;
    };
  };
}

export class BigCommerceClient {
  private config: BigCommerceConfig;
  private baseUrl: string;
  private apiUrl: string;
  private loginUrl: string;
  private headers: Record<string, string>;
  private maxRetries: number;

  constructor(config: BigCommerceConfig) {
    this.config = config;
    this.apiUrl = config.apiUrl || "https://api.bigcommerce.com";
    this.loginUrl = config.loginUrl || "https://login.bigcommerce.com";
    this.maxRetries = config.maxRetries || 3;

    this.baseUrl = this.config.storeHash
      ? `${this.apiUrl}/stores/${this.config.storeHash}`
      : this.apiUrl;

    this.headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Accept-Encoding": "*",
      ...config.headers,
    };

    if (config.accessToken) {
      this.headers["X-Auth-Token"] = config.accessToken;
    }
  }

  static createClient(config: BigCommerceConfig): BigCommerceClient {
    return new BigCommerceClient(config);
  }

  private async handleRateLimit(response: Response, retryCount: number = 0): Promise<any> {
    const retryAfterMs = parseInt(response.headers.get("X-Rate-Limit-Time-Reset-Ms") || "30000", 10);
    const retryAfterSecs = Math.ceil(retryAfterMs / 1000);
    
    if (this.config.failOnLimitReached) {
      const error = new Error(`Rate limit reached. Retry after ${retryAfterSecs} seconds`);
      (error as any).retryAfter = retryAfterSecs;
      throw error;
    }

    if (retryCount >= this.maxRetries) {
      throw new Error(`Rate limit reached. Max retries (${this.maxRetries}) exceeded.`);
    }

    const quota = response.headers.get("X-Rate-Limit-Requests-Quota");
    const remaining = response.headers.get("X-Rate-Limit-Requests-Left");
    const timeWindow = response.headers.get("X-Rate-Limit-Time-Window-Ms");

    console.warn(
      `Rate limit reached. Retrying after ${retryAfterSecs} seconds. ` +
      `Attempt ${retryCount + 1}/${this.maxRetries}. ` +
      `Quota: ${quota}, Remaining: ${remaining}, Window: ${timeWindow}ms`
    );
    
    await new Promise(resolve => setTimeout(resolve, retryAfterMs));
    
    const newOptions = {
      ...this.lastRequestOptions,
      retryCount: retryCount + 1
    };
    
    return this.request(this.lastRequestPath, newOptions);
  }

  private lastRequestPath: string = "";
  private lastRequestOptions: RequestOptions = {};

  private async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = endpoint.startsWith("http") ? endpoint : `${this.baseUrl}${endpoint}`;
    this.lastRequestPath = endpoint;
    this.lastRequestOptions = options;

    const requestOptions = {
      method: options.method || "GET",
      headers: { ...this.headers, ...options.headers },
      body: options.body ? JSON.stringify(options.body) : undefined,
    };

    const response = await fetch(url, requestOptions);

    if (response.status === 429) {
      return this.handleRateLimit(response, options.retryCount || 0);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as T;
  }

  public async get<T = any>(endpoint: string, query = {}): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  public async post<T = any>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data,
    });
  }

  public async put<T = any>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data,
    });
  }

  public async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    });
  }

  // GraphQL request method
  public async graphqlRequest<T = any>(
    query: string,
    variables: Record<string, any> = {}
  ): Promise<T> {
    const endpoint = `/graphql`;
    const response = await this.request<{data?: T; errors?: any[]}>(endpoint, {
      method: "POST",
      body: { query, variables },
    });

    if (response.errors && response.errors.length > 0) {
      throw new Error(response.errors[0].message);
    }

    if (!response.data) {
      throw new Error('No data returned from GraphQL request');
    }

    return response.data;
  }

  // REST API Helper Methods

  // Channels
  async getAvailableChannels() {
    return this.request<{data: any[]}>(`/v3/channels?available=true`, { method: "GET" });
  }

  async getChannelLocales(channelId: number) {
    return this.request<{data: any[]}>(`/v3/settings/store/locales?channel_id=${channelId}`, {
      method: "GET",
    });
  }

  // Store Information
  async getStoreInformation() {
    return this.request<StoreInformationResponse>(`/v2/store.json`, { method: "GET" });
  }
}

// Helper function to create a client instance
export function createBigCommerceClient(
  config: BigCommerceConfig
): BigCommerceClient {
  return BigCommerceClient.createClient(config);
}
