export const graphqlApiDomain = process.env.BIGCOMMERCE_GRAPHQL_API_DOMAIN ?? 'mybigcommerce.com';
export const adminApiHostname = process.env.BIGCOMMERCE_ADMIN_API_HOST ?? 'api.bigcommerce.com';

export const DEFAULT_RETRY_AFTER_MS = 30000;
export const DEFAULT_MAX_RETRIES = 3;

// GraphQL complexity header
export const GRAPHQL_COMPLEXITY_HEADER = 'x-bc-graphql-complexity'; 