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

    // console.log("\n\nGraphQL Query:\n", query);
    // console.log("\n\nGraphQL Variables:\n", JSON.stringify(variables, null, 2));

    const response = await fetch(this.baseUrl, requestOptions);
    const data = await response.json();

    // console.log("\n\nGraphQL Response:\n", JSON.stringify(data, null, 2));

    if (typeof data === 'object' && data && 'errors' in data) {
      // TODO: Log the GraphQL error message including the schema details
      // Sample error response:
      // [
      //   {
      //       "message": "Internal server error",
      //       "path": [
      //           "product",
      //           "setProductModifiersInformation"
      //       ],
      //       "locations": [
      //           {
      //               "line": 7,
      //               "column": 9
      //           }
      //       ]
      //   }
      // ]
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
        preOrderSettings {
          message
        }
        storefrontDetails {
          warranty
          availabilityDescription
          searchKeywords
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

    const localeCheckboxModifierQueries = availableLocales.map((locale) =>
      locale.code === defaultLocale ? "" : `
      ${locale.code}: overridesForLocale (localeContext: { channelId: "bc/store/channel/${channelId}", locale: "${locale.code}" }) {
        displayName
        ... on CheckboxProductModifierForLocale {
          fieldValue
        }
      }
      `
    );

    const localeTextFieldModifierQueries = availableLocales.map((locale) =>
      locale.code === defaultLocale ? "" : `
      ${locale.code}: overridesForLocale (localeContext: { channelId: "bc/store/channel/${channelId}", locale: "${locale.code}" }) {
        displayName
        ... on TextFieldProductModifierForLocale {
          defaultValue
        }
      }
      `
    );

    const localeMultilineTextFieldModifierQueries = availableLocales.map((locale) =>
      locale.code === defaultLocale ? "" : `
      ${locale.code}: overridesForLocale (localeContext: { channelId: "bc/store/channel/${channelId}", locale: "${locale.code}" }) {
        displayName
        ... on MultilineTextFieldProductModifierForLocale {
          defaultValue
        }
      }
      `
    );

    const localeNumbersOnlyTextFieldModifierQueries = availableLocales.map((locale) =>
      locale.code === defaultLocale ? "" : `
      ${locale.code}: overridesForLocale (localeContext: { channelId: "bc/store/channel/${channelId}", locale: "${locale.code}" }) {
        displayName
        ... on NumbersOnlyTextFieldProductModifierForLocale {
          defaultValueFloat: defaultValue
        }
      }
      `
    );

    const localeBasicModifierQueries = availableLocales.map((locale) =>
      locale.code === defaultLocale ? "" : `
      ${locale.code}: overridesForLocale (localeContext: { channelId: "bc/store/channel/${channelId}", locale: "${locale.code}" }) {
        displayName
      }
      `
    );

    const localeModifierValueQueries = availableLocales.map((locale) =>
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
                preOrderSettings {
                  message
                }
                storefrontDetails {
                  warranty
                  availabilityDescription
                  searchKeywords
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
                      id
                      displayName
                      values {
                        id
                        label
                        isDefault
                      }
                      ${localeOptionQueries}
                    }
                  }
                }
                modifiers {
                  edges {
                    node {
                      __typename
                      id
                      displayName
                      isShared
                      isRequired
                      ... on CheckboxProductModifier {
                        checkedByDefault
                        fieldValue
                        ${localeCheckboxModifierQueries}
                      }
                      ... on TextFieldProductModifier {
                        defaultValue
                        ${localeTextFieldModifierQueries}
                      }
                      ... on MultilineTextFieldProductModifier {
                        defaultValue
                        ${localeMultilineTextFieldModifierQueries}
                      }
                      ... on NumbersOnlyTextFieldProductModifier {
                        defaultValueFloat: defaultValue
                        ${localeNumbersOnlyTextFieldModifierQueries}
                      }
                      ... on DropdownProductModifier {
                        values {
                          id
                          label
                          isDefault
                        }
                        ${localeModifierValueQueries}
                      }
                      ... on RadioButtonsProductModifier {
                        values {
                          id
                          label
                          isDefault
                        }
                        ${localeModifierValueQueries}
                      }
                      ... on RectangleListProductModifier {
                        values {
                          id
                          label
                          isDefault
                        }
                        ${localeModifierValueQueries}
                      }
                      ... on SwatchProductModifier {
                        values {
                          id
                          label
                          isDefault
                        }
                        ${localeModifierValueQueries}
                      }
                      ... on PickListProductModifier {
                        values {
                          id
                          label
                          isDefault
                        }
                        ${localeModifierValueQueries}
                      }
                      ... on FileUploadProductModifier {
                        ${localeBasicModifierQueries}
                      }
                      ... on DateFieldProductModifier {
                        ${localeBasicModifierQueries}
                      }
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

    const hasModifiers = variables.modifiersInput && 
      variables.modifiersInput.data && 
      variables.modifiersInput.data.modifiers && 
      variables.modifiersInput.data.modifiers.length > 0;

    const hasRemovedModifiers = variables.removedModifiersInput &&
      variables.removedModifiersInput.data &&
      variables.removedModifiersInput.data.modifiers &&
      variables.removedModifiersInput.data.modifiers.length > 0;

    const mutationQuery = `
      mutation (
        $channelId: ID!,
        $locale: String!,
        $input: SetProductBasicInformationInput!,
        $seoInput: SetProductSeoInformationInput!,
        $preOrderInput: SetProductPreOrderSettingsInput!,
        $storefrontInput: SetProductStorefrontDetailsInput!
        ${hasRemovedOptions ? '$removedOptionsInput: RemoveProductOptionsOverridesInput!,' : ''}
        ${hasOptions ? '$optionsInput: SetProductOptionsInformationInput!,' : ''}
        ${hasRemovedModifiers ? '$removedModifiersInput: RemoveProductModifiersOverridesInput!,' : ''}
        ${hasModifiers ? '$modifiersInput: SetProductModifiersInformationInput!,' : ''}
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
          setProductPreOrderSettings(input: $preOrderInput) {
            product {
              overridesForLocale (localeContext: { channelId: $channelId, locale: $locale }) {
                preOrderSettings {
                  message
                }
              }
            }
          }
          setProductStorefrontDetails(input: $storefrontInput) {
            product {
              overridesForLocale (localeContext: { channelId: $channelId, locale: $locale }) {
                storefrontDetails {
                  warranty
                  availabilityDescription
                  searchKeywords
                }
              }
            }
          }
          ${hasRemovedOptions ? `
          removeProductOptionsOverrides (input: $removedOptionsInput) {
            product {
              id
              options {
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
          ${hasRemovedModifiers ? `
          removeProductModifiersOverrides (input: $removedModifiersInput) {
            product {
              id
              modifiers {
                edges {
                  node {
                    __typename
                    id
                    displayName
                    ... on CheckboxProductModifier {
                      overridesForLocale(
                        localeContext: {
                          channelId: $channelId,
                          locale: $locale
                        }
                      ) {
                        displayName
                        fieldValue
                      }
                    }
                    ... on TextFieldProductModifier {
                      overridesForLocale(
                        localeContext: {
                          channelId: $channelId,
                          locale: $locale
                        }
                      ) {
                        displayName
                        defaultValue
                      }
                    }
                    ... on MultilineTextFieldProductModifier {
                      overridesForLocale(
                        localeContext: {
                          channelId: $channelId,
                          locale: $locale
                        }
                      ) {
                        displayName
                        defaultValue
                      }
                    }
                    ... on NumbersOnlyTextFieldProductModifier {
                      overridesForLocale(
                        localeContext: {
                          channelId: $channelId,
                          locale: $locale
                        }
                      ) {
                        displayName
                        defaultValueFloat: defaultValue
                      }
                    }
                    ... on DropdownProductModifier {
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
                    ... on RadioButtonsProductModifier {
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
                    ... on RectangleListProductModifier {
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
                    ... on SwatchProductModifier {
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
                    ... on PickListProductModifier {
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
                    ... on FileUploadProductModifier {
                      overridesForLocale(
                        localeContext: {
                          channelId: $channelId,
                          locale: $locale
                        }
                      ) {
                        displayName
                      }
                    }
                    ... on DateFieldProductModifier {
                      overridesForLocale(
                        localeContext: {
                          channelId: $channelId,
                          locale: $locale
                        }
                      ) {
                        displayName
                      }
                    }
                  }
                }
              }
            }
          }
          ` : ''}
          ${hasModifiers ? `
          setProductModifiersInformation (input: $modifiersInput) {
            product {
              id
              modifiers {
                edges {
                  node {
                    __typename
                    id
                    ... on CheckboxProductModifier {
                      overridesForLocale(
                        localeContext: {
                          channelId: $channelId,
                          locale: $locale
                        }
                      ) {
                        displayName
                        fieldValue
                      }
                    }
                    ... on TextFieldProductModifier {
                      overridesForLocale(
                        localeContext: {
                          channelId: $channelId,
                          locale: $locale
                        }
                      ) {
                        displayName
                        defaultValue
                      }
                    }
                    ... on MultilineTextFieldProductModifier {
                      overridesForLocale(
                        localeContext: {
                          channelId: $channelId,
                          locale: $locale
                        }
                      ) {
                        displayName
                        defaultValue
                      }
                    }
                    ... on NumbersOnlyTextFieldProductModifier {
                      overridesForLocale(
                        localeContext: {
                          channelId: $channelId,
                          locale: $locale
                        }
                      ) {
                        displayName
                        defaultValueFloat: defaultValue
                      }
                    }
                    ... on DropdownProductModifier {
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
                    ... on RadioButtonsProductModifier {
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
                    ... on RectangleListProductModifier {
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
                    ... on SwatchProductModifier {
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
                    ... on PickListProductModifier {
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
                    ... on FileUploadProductModifier {
                      overridesForLocale(
                        localeContext: {
                          channelId: $channelId,
                          locale: $locale
                        }
                      ) {
                        displayName
                      }
                    }
                    ... on DateFieldProductModifier {
                      overridesForLocale(
                        localeContext: {
                          channelId: $channelId,
                          locale: $locale
                        }
                      ) {
                        displayName
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
