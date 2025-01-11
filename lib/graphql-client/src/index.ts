import { GraphQLClient } from './client';
export * from './client';
export * from './types';
export * from './queries';

export function createGraphQLClient(accessToken: string, storeHash: string) {
  return new GraphQLClient({ accessToken, storeHash });
} 