interface GraphQLClientConfig {
  accessToken: string;
  storeHash: string;
}

export interface ProductLocaleQueryOptions {
  pid: string;
  channelId: string;
  availableLocales: Array<{ code: string }>;
  defaultLocale: string;
}

export interface ProductLocaleMutationOptions {
  pid: string;
  channelId: string;
  locale: string;
}

export class GraphQLClient {
  private baseUrl: string;
  private headers: Headers;

  constructor({ accessToken, storeHash }: GraphQLClientConfig) {
    this.baseUrl = `https://api.bigcommerce.com/stores/${storeHash}/graphql`;
    this.headers = new Headers({
      'X-Auth-Token': accessToken,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    });
  }

  async request<T = any>(query: string, variables: Record<string, any> = {}): Promise<T> {
    const requestOptions = {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ query, variables }),
      redirect: 'follow' as RequestRedirect,
    };

    const response = await fetch(this.baseUrl, requestOptions);
    const data = await response.json();

    if (typeof data === 'object' && data && 'errors' in data) {
      throw new Error((data.errors as any[])[0].message);
    }

    return data as T;
  }

  async getProductLocaleData({
    pid,
    channelId,
    availableLocales,
    defaultLocale
  }: ProductLocaleQueryOptions) {
    const localeQueries = availableLocales.map((locale) => 
      locale.code === defaultLocale ? "" : `
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
      `
    );

    const localeOptionQueries = availableLocales.map((locale) => 
      locale.code === defaultLocale ? "" : `
      ${locale.code}: overridesForLocale (localeContext: { channelId: "bc/store/channel/${channelId}", locale: "${locale.code}" }) {
        displayName
        values {
          id
          label
        }
      }
      `
    );

    const query = `
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
                customFields {
                  edges {
                    node {
                      id
                      name
                      value
                      ${availableLocales.map(locale => 
                        locale.code === defaultLocale ? "" : `
                        ${locale.code}: overrides (context: { channelId: "bc/store/channel/${channelId}", locale: "${locale.code}" }) {
                          edges {
                            node {
                              ... on ProductCustomFieldOverridesForChannelLocale {
                                name
                                value
                              }
                            }
                          }
                        }
                        `
                      ).join('')}
                    }
                  }
                }
                options {
                  edges {
                    node {
                      __typename
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
    `;

    return this.request(query);
  }

  async updateProductLocaleData({
    pid,
    channelId,
    locale
  }: ProductLocaleMutationOptions, variables: any) {
    const hasCustomFields = variables.customFieldsInput && 
      variables.customFieldsInput.data && 
      variables.customFieldsInput.data.length > 0;

    const hasOptions = variables.optionsInput && 
      variables.optionsInput.data && 
      variables.optionsInput.data.options && 
      variables.optionsInput.data.options.length > 0;

    const hasRemovedOptions = variables.removedOptionsInput &&
      variables.removedOptionsInput.data &&
      variables.removedOptionsInput.data.options &&
      variables.removedOptionsInput.data.options.length > 0;

    const mutationQuery = `
      mutation (
        $channelId: ID!,
        $locale: String!,
        $input: SetProductBasicInformationInput!,
        $seoInput: SetProductSeoInformationInput!
        ${hasRemovedOptions ? '$removedOptionsInput: RemoveProductOptionsOverridesInput!,' : ''}
        ${hasOptions ? '$optionsInput: SetProductOptionsInformationInput!,' : ''}
        ${hasCustomFields ? '$customFieldsInput: UpdateProductCustomFieldsInput!' : ''}
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
          ${hasRemovedOptions ? `
          removeProductOptionsOverrides (input: $removedOptionsInput) {
            product {
              id
              options {
                __typename
                edges {
                  node {
                    id
                    displayName
                    values {
                      id
                      label
                    }
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
          ` : ''}
          ${hasOptions ? `
          setProductOptionsInformation (input: $optionsInput) {
            product {
              id
              options {
                edges {
                  node {
                    __typename
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
          ` : ''}
          ${hasCustomFields ? `
          updateProductCustomFields(input: $customFieldsInput) {
            product {
              customFields {
                edges {
                  node {
                    id
                    name
                    value
                    overrides(context: { channelId: $channelId, locale: $locale }) {
                      edges {
                        node {
                          ... on ProductCustomFieldOverridesForChannelLocale {
                            name
                            value
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          ` : ''}
        }
      }
    `;

    return this.request(mutationQuery, variables);
  }
}

export function createGraphQLClient(accessToken: string, storeHash: string): GraphQLClient {
  return new GraphQLClient({ accessToken, storeHash });
}
