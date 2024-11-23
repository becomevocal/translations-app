import { type NextRequest } from "next/server";
import { bigcommerceClient, getSession } from "@/lib/auth";
import {
  availableLocales,
  defaultLocale,
  translatableProductFields,
} from "@/lib/constants";

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

    const myHeaders = new Headers();
    myHeaders.append("X-Auth-Token", accessToken);
    myHeaders.append("Accept", " application/json");
    myHeaders.append("Content-Type", " application/json");

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

    const graphql = JSON.stringify({
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
      variables: {},
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: graphql,
      redirect: "follow" as RequestRedirect,
    };

    const response = await fetch(
      `https://api.bigcommerce.com/stores/${storeHash}/graphql`,
      requestOptions
    );
    const gqlData = (await response.json()) as any;

    let productData = {
      ...gqlData.data.store.products.edges[0].node["basicInformation"],
      ...gqlData.data.store.products.edges[0].node["seoInformation"],
      options: gqlData.data.store.products.edges[0].node["options"],
    };
    productData.localeData = {};
    availableLocales.forEach((locale) => {
      if (defaultLocale !== locale.code) {
        productData.localeData[locale.code] = {
          ...gqlData.data.store.products.edges[0].node[locale.code][
            "basicInformation"
          ],
          ...gqlData.data.store.products.edges[0].node[locale.code][
            "seoInformation"
          ],
          options: gqlData.data.store.products.edges[0].node.options.edges.map(
            (edge: any) => ({
              node: {
                id: edge.node.id,
                displayName: edge.node[locale.code]?.displayName || null,
                values: edge.node[locale.code]?.values || []
              }
            })
          )
        };
      }
    });

    return Response.json(productData);
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
    const bigcommerce = bigcommerceClient(accessToken, storeHash);

    if (body["locale"] && body.locale !== defaultLocale) {
      const selectedLocale = body.locale;

      const myHeaders = new Headers();
      myHeaders.append("X-Auth-Token", accessToken);
      myHeaders.append("Accept", " application/json");
      myHeaders.append("Content-Type", " application/json");

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

      const graphql = JSON.stringify({
        query: mutationQuery,
        variables: {
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
              options: [
                {
                  optionId: "bc/store/productOption/487",
                  data: {
                    dropdown: {
                      displayName: "test1",
                      values: [
                        {
                          valueId: "bc/store/productOptionValue/1850",
                          label: "test2",
                        },
                      ],
                    }
                  },
                }
              ]
            }
          }
        },
      });
      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: graphql,
        redirect: "follow" as RequestRedirect,
      };

      const response = await fetch(
        `https://api.bigcommerce.com/stores/${storeHash}/graphql`,
        requestOptions
      );

      const gqlData = (await response.json()) as any;

      result = {
        ...gqlData?.data?.product?.setProductBasicInformation?.product
          ?.overridesForLocale?.basicInformation,
        ...gqlData?.data?.product?.setProductSeoInformation?.product
          ?.overridesForLocale?.seoInformation,
          options: gqlData?.data?.product?.setProductOptionsInformation?.product
          ?.options?.edges,
      };
    } else {
      // This is for the default lang, so update the main product
      // (currently the front-end does not allow this)
      const { data: updatedProduct } = await bigcommerce.put(
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
