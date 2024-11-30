import { type NextRequest } from "next/server";
import { bigcommerceClient, getSession } from "@/lib/auth";
import {
  availableLocales,
  defaultLocale,
  translatableProductFields,
} from "@/lib/constants";
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createGraphQLClient } from '@/lib/graphql-client';

function createGraphFieldsFromPostData(
  postData: { [key: string]: string },
  graphqlParentObject: string
): { [key: string]: string } {
  return translatableProductFields
    .filter(
      (productField) => productField.graphqlParentObject === graphqlParentObject
    )
    .reduce<{ [key: string]: string }>((acc, field) => {
      acc[field.key] = postData[field.key];
      return acc;
    }, {});
}

function debugLog(data: any, prefix: string = '') {
  // Only log in development environment
  if (process.env.NODE_ENV !== 'development') return;

  try {
    const logsDir = join(process.cwd(), 'logs');
    mkdirSync(logsDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${prefix}debug-${timestamp}.json`;
    
    writeFileSync(
      join(logsDir, filename),
      JSON.stringify(data, null, 2)
    );
  } catch (error) {
    console.error('Failed to write debug log:', error);
  }
}

function transformGraphQLOptionsDataToLocaleData(optionsData: any, localeCode: string) {
  // Ensure we're working with an array of edges
  const options = optionsData?.edges || optionsData || [];
  
  return options.reduce((acc: any, edge: any) => {
    const optionId = edge.node.id;
    const localeOption = edge.node[localeCode];
    
    acc[optionId] = {
      displayName: localeOption?.displayName || '',
      values: {}
    };

    edge.node.values.forEach((value: any) => {
      const localeValue = localeOption?.values?.find((v: any) => v.id === value.id);
      acc[optionId].values[value.id] = localeValue?.label || '';
    });

    return acc;
  }, {});
}

function transformPostedOptionDataToGraphQLSchema(optionData: any) {
  if (!optionData.options) return [];
  
  return Object.entries(optionData.options).map(([optionId, optionDetails]: [string, any]) => ({
    optionId,
    data: {
      dropdown: {
        displayName: optionDetails.displayName,
        values: Object.entries(optionDetails.values).map(([valueId, label]) => ({
          valueId,
          label
        }))
      }
    }
  }));
}

function transformGraphQLOptionsResponse(optionsData: any) {
  if (!optionsData?.edges) return {};
  
  return optionsData.edges.reduce((acc: any, edge: any) => {
    const optionId = edge.node.id;
    const localeData = edge.node.overridesForLocale;
    
    acc[optionId] = {
      displayName: localeData?.displayName || '',
      values: {}
    };

    // Transform values array into object with id as key
    if (localeData?.values) {
      localeData.values.forEach((value: any) => {
        acc[optionId].values[value.id] = value.label;
      });
    }

    return acc;
  }, {});
}

export async function GET(
  request: NextRequest,
  { params }: { params: { pid: string } }
) {
  const pid = params.pid;
  const searchParams = request.nextUrl.searchParams;
  const context = searchParams.get("context") ?? "";
  const channelId = searchParams.get("channel_id") ?? null;

  if (!channelId) {
    return new Response("Channel ID missing", {
      status: 422,
    });
  }

  try {
    const { accessToken, storeHash } = await getSession({ query: { context } });
    const graphQLClient = createGraphQLClient(accessToken, storeHash);

    const localeQueries = availableLocales.map((locale) => {
      if (locale.code === defaultLocale) {
        return "";
      }

      return `
      ${locale.code}: overridesForLocale (localeContext: { channelId: "bc/store/channel/${channelId}", locale: "${locale.code}" }) {
        basicInformation {
          name
          description
        }
        seoInformation {
          pageTitle
          metaDescription
        }
      }
      `;
    });

    const localeOptionQueries = availableLocales.map((locale) => {
      if (locale.code === defaultLocale) {
        return "";
      }

      return `
      ${locale.code}: overridesForLocale (localeContext: { channelId: "bc/store/channel/${channelId}", locale: "${locale.code}" }) {
        displayName
        values {
          id
          label
        }
      }
      `;
    });

    const graphql = {
      query: `
        query {
          store {
            products (filters: {ids: ["bc/store/product/${pid}"]}) {
              edges {
                node {
                  id
                  basicInformation {
                    name
                    description
                  }
                  seoInformation {
                    pageTitle
                    metaDescription
                  }
                  options {
                    edges {
                      node {
                        id
                        displayName
                        isShared
                        values {
                          id
                          label
                          isDefault
                        }
                        ${localeOptionQueries}
                      }
                    }
                  }
                  ${localeQueries}
                }
              }
            }
          }
        }
      `,
      variables: {}
    };

    const gqlData = await graphQLClient.request(graphql.query, graphql.variables);

    if (!gqlData?.data?.store?.products?.edges?.[0]?.node) {
      debugLog(gqlData, 'GET-error-response-');
      return new Response("Product not found or invalid GraphQL response", {
        status: 404,
      });
    }

    const productNode = gqlData.data.store.products.edges[0].node;

    const normalizedProductData = {
      name: productNode.basicInformation?.name,
      description: productNode.basicInformation?.description,
      pageTitle: productNode.seoInformation?.pageTitle,
      metaDescription: productNode.seoInformation?.metaDescription,
      options: {
        edges: (productNode.options?.edges || []).map((edge: any) => ({
          node: {
            id: edge.node?.id,
            displayName: edge.node?.displayName,
            values: (edge.node?.values || []).map((value: any) => ({
              id: value?.id,
              label: value?.label
            }))
          }
        }))
      },
      localeData: {} as { [key: string]: any }
    };

    availableLocales.forEach((locale) => {
      if (defaultLocale !== locale.code) {
        const localeNode = gqlData.data.store.products.edges[0].node[locale.code];
        const options = gqlData.data.store.products.edges[0].node?.options?.edges;
        
        normalizedProductData.localeData[locale.code] = {
          name: localeNode?.basicInformation?.name ?? null,
          description: localeNode?.basicInformation?.description ?? null,
          pageTitle: localeNode?.seoInformation?.pageTitle ?? null,
          metaDescription: localeNode?.seoInformation?.metaDescription ?? null,
          options: transformGraphQLOptionsDataToLocaleData(options, locale.code)
        };
      }
    });

    return Response.json(normalizedProductData);
  } catch (error: any) {
    const { message, response } = error;

    return new Response(message || "Authentication failed, please re-install", {
      status: response?.status || 500,
    });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { pid: string } }
) {
  const body = (await request.json()) as any;
  const pid = params.pid;
  const searchParams = request.nextUrl.searchParams;
  const context = searchParams.get("context") ?? "";
  const channelId = searchParams.get("channel_id") ?? null;

  if (!channelId) {
    return new Response("Channel ID missing", {
      status: 422,
    });
  }

  try {
    let result: any;
    const { accessToken, storeHash } = await getSession({ query: { context } });
    const graphQLClient = createGraphQLClient(accessToken, storeHash);

    if (body["locale"] && body.locale !== defaultLocale) {
      const selectedLocale = body.locale;

      const mutationQuery = `
        mutation (
          $channelId: ID!,
          $locale: String!,
          $input: SetProductBasicInformationInput!,
          $seoInput: SetProductSeoInformationInput!
          $optionsInput: SetProductOptionsInformationInput!
        ) {
          product {
            setProductBasicInformation(input: $input) {
              product {
                id
                overridesForLocale (localeContext: { channelId: $channelId, locale: $locale }) {
                  basicInformation {
                    name
                    description
                  }
                }
              }
            }
            setProductSeoInformation(input: $seoInput) {
              product {
                id
                overridesForLocale (localeContext: { channelId: $channelId, locale: $locale }) {
                  seoInformation {
                    pageTitle
                    metaDescription
                  }
                }
              }
            }
            setProductOptionsInformation (input: $optionsInput) {
              product {
                id
                options {
                  edges {
                    node {
                      id
                      overridesForLocale(
                        localeContext: {
                          channelId: $channelId,
                          locale: $locale
                        }
                      ) {
                        displayName
                        values {
                          id
                          label
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const productGraphData = createGraphFieldsFromPostData(
        body,
        "basicInformation"
      );
      const seoGraphData = createGraphFieldsFromPostData(
        body,
        "seoInformation"
      );

      const optionData = createGraphFieldsFromPostData(body, "options");

      const graphVariables = {
        channelId: `bc/store/channel/${channelId}`,
        locale: selectedLocale,
        input: {
          productId: `bc/store/product/${pid}`,
          localeContext: {
            channelId: `bc/store/channel/${channelId}`,
            locale: selectedLocale,
          },
          data: productGraphData,
        },
        seoInput: {
          productId: `bc/store/product/${pid}`,
          localeContext: {
            channelId: `bc/store/channel/${channelId}`,
            locale: selectedLocale,
          },
          data: seoGraphData,
        },
        optionsInput: {
          productId: `bc/store/product/${pid}`,
          localeContext: {
            channelId: `bc/store/channel/${channelId}`,
            locale: selectedLocale,
          },
          data: {
            options: transformPostedOptionDataToGraphQLSchema(optionData)
          }
        }
      };

      const gqlData = await graphQLClient.request(mutationQuery, graphVariables);

      result = {
        ...gqlData?.data?.product?.setProductBasicInformation?.product
          ?.overridesForLocale?.basicInformation,
        ...gqlData?.data?.product?.setProductSeoInformation?.product
          ?.overridesForLocale?.seoInformation,
        options: transformGraphQLOptionsResponse(
          gqlData?.data?.product?.setProductOptionsInformation?.product?.options
        ),
      };
    } else {
      // This is for the default lang, so update the main product
      // (currently the front-end does not allow this)
      const { data: updatedProduct } = await bigcommerceClient(accessToken, storeHash).put(
        `/catalog/products/${pid}`,
        body
      );
      result = updatedProduct;
    }

    return Response.json(result);
  } catch (error: any) {
    const { message, response } = error;

    return new Response(message || "Authentication failed, please re-install", {
      status: response?.status || 500,
    });
  }
}

// export const runtime = 'edge';
