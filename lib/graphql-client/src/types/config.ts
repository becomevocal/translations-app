export interface GraphQLClientConfig {
  accessToken: string;
  storeHash: string;
  maxRetries?: number;
  failOnLimitReached?: boolean;
} 