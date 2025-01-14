export interface FetcherRequestInit extends Omit<RequestInit, 'body'> {
  body?: string | Record<string, unknown>;
}

export interface ComplexityConfig {
  onComplexityUpdate?: (complexity: number) => void;
}

export interface GraphQLClientConfig {
  accessToken: string;
  storeHash: string;
  maxRetries?: number;
  failOnLimitReached?: boolean;
  apiDomain?: string;
  apiHostname?: string;
  complexity?: ComplexityConfig;
  beforeRequest?: (
    fetchOptions?: FetcherRequestInit,
  ) => Promise<Partial<FetcherRequestInit> | undefined> | Partial<FetcherRequestInit> | undefined;
  afterResponse?: (response: Response) => Promise<void> | void;
} 