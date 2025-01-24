import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';
import { config } from 'dotenv';
import { adminApiHostname } from '../lib/graphql-client/src/constants';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function fetchSchema() {
  if (!process.env.BIGCOMMERCE_STORE_HASH || !process.env.BIGCOMMERCE_ACCESS_TOKEN) {
    throw new Error('Missing required environment variables: BIGCOMMERCE_STORE_HASH and BIGCOMMERCE_ACCESS_TOKEN');
  }

  const response = await fetch(
    `https://${adminApiHostname}/stores/${process.env.BIGCOMMERCE_STORE_HASH}/graphql`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': process.env.BIGCOMMERCE_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query: `
          query IntrospectionQuery {
            __schema {
              queryType { name }
              mutationType { name }
              subscriptionType { name }
              types {
                ...FullType
              }
              directives {
                name
                description
                locations
                args {
                  ...InputValue
                }
              }
            }
          }

          fragment FullType on __Type {
            kind
            name
            description
            fields(includeDeprecated: true) {
              name
              description
              args {
                ...InputValue
              }
              type {
                ...TypeRef
              }
              isDeprecated
              deprecationReason
            }
            inputFields {
              ...InputValue
            }
            interfaces {
              ...TypeRef
            }
            enumValues(includeDeprecated: true) {
              name
              description
              isDeprecated
              deprecationReason
            }
            possibleTypes {
              ...TypeRef
            }
          }

          fragment InputValue on __InputValue {
            name
            description
            type {
              ...TypeRef
            }
            defaultValue
          }

          fragment TypeRef on __Type {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                  }
                }
              }
            }
          }
        `,
      }),
    }
  );

  const result = await response.json();

  if (result.errors) {
    console.error('GraphQL errors:', result.errors);
    throw new Error('Failed to fetch schema');
  }

  // Save introspection result to a temporary file
  const tempFile = resolve(__dirname, '../lib/graphql-client/temp-schema.json');
  writeFileSync(tempFile, JSON.stringify(result.data, null, 2));

  // Generate schema using gql.tada CLI
  execSync(`gql.tada generate-schema "${tempFile}" --output "${resolve(__dirname, '../lib/graphql-client/schema.graphql')}"`, { stdio: 'inherit' });

  // Generate TypeScript types
  execSync(`gql.tada generate-output --tsconfig "${resolve(__dirname, '../tsconfig.json')}" --output "${resolve(__dirname, '../lib/graphql-client/src/graphql-env.d.ts')}"`, { stdio: 'inherit' });

  console.log('✨ Schema and types generated successfully!');
}

fetchSchema().catch((error) => {
  console.error('Failed to generate schema:', error);
  process.exit(1);
}); 