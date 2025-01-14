export interface BigCommerceResponseError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: string[];
}

export interface BigCommerceGraphQLError extends Error {
  errors?: BigCommerceResponseError[];
  retryAfter?: number;
  status?: number;
  response?: Response;
}

export interface RateLimitError extends BigCommerceGraphQLError {
  retryAfter: number;
  quota?: string;
  remaining?: string;
  timeWindow?: string;
}

export interface ComplexityLimitError extends BigCommerceGraphQLError {
  complexity: number;
  maxComplexity: number;
} 