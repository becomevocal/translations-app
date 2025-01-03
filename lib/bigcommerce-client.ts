import { SignJWT, jwtVerify } from 'jose';
import { QueryParams, SessionProps } from '../types';

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
}

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

interface ProductLocaleQueryOptions {
  pid: string;
  channelId: string;
  availableLocales: Array<{ code: string }>;
  defaultLocale: string;
}

interface ProductLocaleMutationOptions {
  pid: string;
  channelId: string;
  locale: string;
}

export class BigCommerceClient {
  private config: BigCommerceConfig;
  private baseUrl: string;
  private apiUrl: string;
  private loginUrl: string;
  private headers: Record<string, string>;

  constructor(config: BigCommerceConfig) {
    this.config = config;
    this.apiUrl = config.apiUrl || 'https://api.bigcommerce.com';
    this.loginUrl = config.loginUrl || 'https://login.bigcommerce.com';
    
    this.baseUrl = this.config.storeHash 
      ? `${this.apiUrl}/stores/${this.config.storeHash}` 
      : this.apiUrl;

    this.headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Encoding': '*',
      ...config.headers,
    };

    if (config.accessToken) {
      this.headers['X-Auth-Token'] = config.accessToken;
    }
  }

  static createClient(config: BigCommerceConfig): BigCommerceClient {
    return new BigCommerceClient(config);
  }

  // Core request method
  public async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    
    const requestOptions = {
      method,
      headers: { ...this.headers, ...options.headers },
      body: options.body ? JSON.stringify(options.body) : undefined,
    };
    // console.log("url", url);
    // console.log("requestOptions", requestOptions);

    const response = await fetch(url, requestOptions);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  // GraphQL request method
  public async graphqlRequest<T = any>(query: string, variables: Record<string, any> = {}): Promise<T> {
    const endpoint = `/graphql`;
    const response = await this.request(endpoint, {
      method: 'POST',
      body: { query, variables },
    });

    if (response.errors?.length > 0) {
      throw new Error(response.errors[0].message);
    }

    return response;
  }

  // Authentication methods
  static async verifyJWT(signed_payload_jwt: string, secret: string): Promise<SessionProps> {
    if (!secret) {
      throw new Error('secret is required for JWT verification');
    }

    const { payload } = await jwtVerify(
      signed_payload_jwt,
      new TextEncoder().encode(secret)
    );

    return {
      ...payload,
      context: payload.sub,
      user: {
        id: (payload as any).user?.id,
        email: (payload as any).user?.email,
        locale: (payload as any).user?.locale
      }
    } as SessionProps;
  }

  async authorize(query: QueryParams) {
    if (!this.config.secret) {
      throw new Error('secret is required for authorize');
    }

    const payload = {
      iss: this.config.clientId,
      iat: Math.round(new Date().getTime() / 1000),
      jti: Math.random().toString(36).substring(7),
      operation: 'auth',
      store_hash: typeof query.context === 'string' ? query.context.split('/')[1] : undefined,
      timestamp: Math.round(new Date().getTime() / 1000)
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .sign(new TextEncoder().encode(this.config.secret));

    const authUrl = `${this.loginUrl}/oauth2/token`;
    const body = {
      client_id: this.config.clientId,
      client_secret: this.config.secret,
      code: query.code,
      scope: query.scope,
      grant_type: 'authorization_code',
      context: query.context,
      redirect_uri: this.config.callback
    };

    return this.request(authUrl, {
      method: 'POST',
      body
    });
  }

  // REST API convenience methods
  async get<T = any>(endpoint: string, query = {}): Promise<T> {
    return this.request(endpoint, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data: any): Promise<T> {
    return this.request(endpoint, {
      method: 'POST',
      body: data
    });
  }

  async put<T = any>(endpoint: string, data: any): Promise<T> {
    return this.request(endpoint, {
      method: 'PUT',
      body: data
    });
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }

  // REST API Helper Methods

  // Channels
  async getAvailableChannels() {
    return this.request(`/v3/channels?available=true`, { method: 'GET' });
  }

  async getChannelLocales(channelId: number) {
    return this.request(`/v3/settings/store/locales?channel_id=${channelId}`, { method: 'GET' });
  }

  // Store Information
  async getStoreInformation() {
    return this.request(`/v2/store.json`, { method: 'GET' });
  }
}

// Helper function to create a client instance
export function createBigCommerceClient(config: BigCommerceConfig): BigCommerceClient {
  return BigCommerceClient.createClient(config);
}
