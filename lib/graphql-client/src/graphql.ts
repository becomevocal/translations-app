import { initGraphQLTada } from 'gql.tada';
import type { introspection } from './graphql-env';

// Initialize GraphQL Tada with BigCommerce-specific scalar types
export const graphql = initGraphQLTada<{
  introspection: introspection;
  scalars: {
    // BigCommerce specific scalars
    DateTime: string;
    Decimal: string;
    Float: number;
    Int: number;
    Long: number;
    Money: string;
    URL: string;
    // Generic scalars
    Boolean: boolean;
    ID: string;
    String: string;
  };
}>();

export type { FragmentOf, ResultOf, VariablesOf } from 'gql.tada';
export { readFragment } from 'gql.tada'; 