import { 
  ProductLocaleQueryOptions,
  ProductLocaleUpdateOptions, 
  ProductOptionValue, 
  ProductModifierValue, 
  ProductCustomField,
  ProductModifier,
  ProductModifierBase,
  ProductModifierWithValues,
  ProductCheckboxModifier,
  ProductTextFieldModifier,
  ProductNumberFieldModifier
} from '../types';

import { formatChannelId, formatProductId } from '../utils';

// Field groupings for mutations
const FIELD_GROUPS = {
  basicInformation: ['name', 'description'],
  seoInformation: ['pageTitle', 'metaDescription'],
  storefrontDetails: ['warranty', 'availabilityDescription', 'searchKeywords'],
  preOrderSettings: ['preOrderMessage']
} as const;

// Helper to check if any fields from a group are present in productData
function hasFieldsFromGroup(
  productData: ProductLocaleUpdateOptions['productData'], 
  groupFields: readonly string[]
): boolean {
  return groupFields.some(field => field in productData && productData[field as keyof typeof productData] !== undefined);
}

// Helper to get fields that should be removed (empty strings)
function getFieldsToRemove(
  productData: ProductLocaleUpdateOptions['productData'], 
  groupFields: readonly string[]
): string[] {
  return [...groupFields].filter(field => {
    const value = productData[field as keyof typeof productData];
    return value !== undefined && (value === '' || value === null);
  });
}

// Helper to build mutation variables from simplified format
function buildMutationVariables(options: ProductLocaleUpdateOptions): any {
  const { locale, channelId, productId, productData } = options;
  const formattedChannelId = formatChannelId(channelId);
  const formattedProductId = formatProductId(productId);
  const variables: any = {
    channelId: formattedChannelId,
    locale
  };

  // Common context object used in mutations
  const localeContext = {
    channelId: formattedChannelId,
    locale
  };

  // Build variables for each field group
  Object.entries(FIELD_GROUPS).forEach(([group, fields]) => {
    if (hasFieldsFromGroup(productData, fields)) {
      // Add mutation input
      const inputData = fields.reduce((acc: any, field) => {
        const value = productData[field as keyof typeof productData];
        if (value !== undefined && value !== '') {
          acc[field] = value;
        }
        return acc;
      }, {});

      if (Object.keys(inputData).length > 0) {
        const inputKey = `${group}Input`;
        variables[inputKey] = {
          productId: formattedProductId,
          localeContext,
          data: inputData
        };
      }

      // Add removal input for empty fields
      const fieldsToRemove = getFieldsToRemove(productData, fields);
      if (fieldsToRemove.length > 0) {
        const removalKey = `removed${group.charAt(0).toUpperCase() + group.slice(1)}Input`;
        variables[removalKey] = {
          productId: formattedProductId,
          localeContext,
          overridesToRemove: fieldsToRemove.map(field => 
            `PRODUCT_${field.toUpperCase()}_FIELD`
          )
        };
      }
    }
  });

  // Handle options
  if ('options' in productData && productData.options) {
    const optionsToUpdate: any[] = [];
    const optionsToRemove: any[] = [];

    Object.entries(productData.options).forEach(([optionId, option]) => {
      // Handle option updates
      if (option.displayName || (option.values && option.values.length > 0)) {
        optionsToUpdate.push({
          optionId,
          data: {
            dropdown: {
              ...(option.displayName && { displayName: option.displayName }),
              ...(option.values && { values: option.values })
            }
          }
        });
      }

      // Handle value removals
      if (option.removeValues && option.removeValues.length > 0) {
        optionsToRemove.push({
          optionId,
          data: {
            dropdown: {
              values: {
                ids: option.removeValues
              }
            }
          }
        });
      }
    });

    // Handle complete option removals
    if (productData.remove?.options?.length) {
      productData.remove.options.forEach((optionId) => {
        optionsToRemove.push({
          optionId,
          data: {
            dropdown: {
              fields: ["DROPDOWN_PRODUCT_OPTION_DISPLAY_NAME_FIELD"]
            }
          }
        });
      });
    }

    if (optionsToUpdate.length > 0) {
      variables.optionsInput = {
        productId: formattedProductId,
        localeContext,
        data: {
          options: optionsToUpdate
        }
      };
    }

    if (optionsToRemove.length > 0) {
      variables.removedOptionsInput = {
        productId: formattedProductId,
        localeContext,
        data: {
          options: optionsToRemove
        }
      };
    }
  }

  // Handle modifiers
  if ('modifiers' in productData && productData.modifiers) {
    const modifiersToUpdate: any[] = [];
    const modifiersToRemove: any[] = [];

    Object.entries(productData.modifiers).forEach(([modifierId, modifier]) => {
      const data: any = {};
      
      // Type guards for each modifier type
      const isCheckboxModifier = (mod: ProductModifier): mod is ProductCheckboxModifier & { __typename?: 'CheckboxProductModifier' } =>
        mod.__typename === 'CheckboxProductModifier' || 'fieldValue' in mod;
      
      const isNumberFieldModifier = (mod: ProductModifier): mod is ProductNumberFieldModifier & { __typename?: 'NumbersOnlyTextFieldProductModifier' } =>
        mod.__typename === 'NumbersOnlyTextFieldProductModifier' || 'defaultValueFloat' in mod;
      
      const isTextFieldModifier = (mod: ProductModifier): mod is ProductTextFieldModifier & { __typename?: 'TextFieldProductModifier' | 'MultilineTextFieldProductModifier' } =>
        mod.__typename === 'TextFieldProductModifier' || mod.__typename === 'MultilineTextFieldProductModifier' || ('defaultValue' in mod && !('values' in mod));
      
      const isModifierWithValues = (mod: ProductModifier): mod is ProductModifierWithValues & { 
        __typename?: 'DropdownProductModifier' | 'RadioButtonsProductModifier' | 'RectangleListProductModifier' | 'SwatchProductModifier' | 'PickListProductModifier'
      } => ['DropdownProductModifier', 'RadioButtonsProductModifier', 'RectangleListProductModifier', 'SwatchProductModifier', 'PickListProductModifier'].includes(mod.__typename || '') || 'values' in mod;

      // Handle updates based on modifier type
      if (modifier.displayName || 
          (isCheckboxModifier(modifier) && modifier.fieldValue) ||
          (isTextFieldModifier(modifier) && modifier.defaultValue) ||
          (isNumberFieldModifier(modifier) && modifier.defaultValueFloat !== undefined) ||
          (isModifierWithValues(modifier) && modifier.values && modifier.values.length > 0)) {

        if (isCheckboxModifier(modifier)) {
          data.checkbox = {
            ...(modifier.displayName && { displayName: modifier.displayName }),
            value: modifier.fieldValue || ''
          };
        } else if (isNumberFieldModifier(modifier)) {
          data.numberField = {
            ...(modifier.displayName && { displayName: modifier.displayName }),
            ...(modifier.defaultValueFloat !== undefined && { defaultValue: modifier.defaultValueFloat })
          };
        } else if (isTextFieldModifier(modifier)) {
          if (modifier.__typename === 'MultilineTextFieldProductModifier') {
            data.multiLineTextField = {
              ...(modifier.displayName && { displayName: modifier.displayName }),
              ...(modifier.defaultValue && { defaultValue: modifier.defaultValue })
            };
          } else {
            data.textField = {
              ...(modifier.displayName && { displayName: modifier.displayName }),
              ...(modifier.defaultValue && { defaultValue: modifier.defaultValue })
            };
          }
        } else if (isModifierWithValues(modifier)) {
          const modifierType = modifier.__typename?.toLowerCase() || 'dropdown';
          const typeMap: { [key: string]: string } = {
            'dropdownproductmodifier': 'dropdown',
            'radiobuttonsproductmodifier': 'radioButtons',
            'rectanglelistproductmodifier': 'rectangleList',
            'swatchproductmodifier': 'swatch',
            'picklistproductmodifier': 'pickList'
          };
          
          const type = typeMap[modifierType] || 'dropdown';
          data[type] = {
            ...(modifier.displayName && { displayName: modifier.displayName }),
            ...(modifier.values && { values: modifier.values })
          };
        } else if (modifier.__typename === 'FileUploadProductModifier') {
          data.fileUpload = {
            ...(modifier.displayName && { displayName: modifier.displayName })
          };
        } else if (modifier.__typename === 'DateFieldProductModifier') {
          data.dateField = {
            ...(modifier.displayName && { displayName: modifier.displayName })
          };
        }

        if (Object.keys(data).length > 0) {
          modifiersToUpdate.push({
            modifierId,
            data
          });
        }
      }

      // Handle value removals
      if (isModifierWithValues(modifier) && modifier.removeValues && modifier.removeValues.length > 0) {
        const modifierType = modifier.__typename?.toLowerCase() || 'dropdown';
        const typeMap: { [key: string]: string } = {
          'dropdownproductmodifier': 'dropdown',
          'radiobuttonsproductmodifier': 'radioButtons',
          'rectanglelistproductmodifier': 'rectangleList',
          'swatchproductmodifier': 'swatch',
          'picklistproductmodifier': 'pickList'
        };
        
        const type = typeMap[modifierType] || 'dropdown';
        modifiersToRemove.push({
          modifierId,
          data: {
            [type]: {
              values: {
                ids: modifier.removeValues
              }
            }
          }
        });
      }
    });

    // Handle complete modifier removals
    if (productData.remove?.modifiers?.length) {
      productData.remove.modifiers.forEach((modifierId) => {
        modifiersToRemove.push({
          modifierId,
          data: {
            textField: {
              fields: ["TEXT_FIELD_PRODUCT_MODIFIER_DISPLAY_NAME_FIELD"]
            }
          }
        });
      });
    }

    if (modifiersToUpdate.length > 0) {
      variables.modifiersInput = {
        productId: formattedProductId,
        localeContext,
        data: {
          modifiers: modifiersToUpdate
        }
      };
    }

    if (modifiersToRemove.length > 0) {
      variables.removedModifiersInput = {
        productId: formattedProductId,
        localeContext,
        data: {
          modifiers: modifiersToRemove
        }
      };
    }
  }

  // Handle custom fields
  if (('customFields' in productData && productData.customFields) || 
      (productData.remove?.customFields?.length)) {
    const customFieldsToUpdate: any[] = [];
    const customFieldsToRemove: any[] = [];

    // Handle custom field updates
    if (productData.customFields) {
      Object.entries(productData.customFields).forEach(([customFieldId, field]) => {
        customFieldsToUpdate.push({
          customFieldId,
          overrides: [{
            channelLocaleOverrides: {
              context: {
                channelId: formattedChannelId,
                locale
              },
              data: {
                name: field.name,
                value: field.value,
                isVisible: true
              }
            }
          }]
        });
      });
    }

    // Handle custom field removals
    if (productData.remove?.customFields?.length) {
      productData.remove.customFields.forEach((customFieldId) => {
        customFieldsToRemove.push({
          customFieldId,
          channelLocaleContextData: {
            context: {
              channelId: formattedChannelId,
              locale
            },
            attributes: ["NAME", "VALUE"]
          }
        });
      });
    }

    if (customFieldsToUpdate.length > 0) {
      variables.customFieldsInput = {
        productId: formattedProductId,
        data: customFieldsToUpdate
      };
    }

    if (customFieldsToRemove.length > 0) {
      variables.removedCustomFieldsInput = {
        productId: formattedProductId,
        data: customFieldsToRemove
      };
    }
  }

  return variables;
}

export const productQueries = {
  getProductLocaleData: ({ pid, channelId, availableLocales, defaultLocale }: ProductLocaleQueryOptions) => {
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

    return {
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
                        ${availableLocales.map((locale) =>
                          locale.code === defaultLocale ? "" : `
                          ${locale.code}: overridesForLocale (localeContext: { channelId: "bc/store/channel/${channelId}", locale: "${locale.code}" }) {
                            displayName
                            values {
                              id
                              label
                            }
                          }
                          `
                        ).join('')}
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
                          ${availableLocales.map((locale) =>
                            locale.code === defaultLocale ? "" : `
                            ${locale.code}: overridesForLocale (localeContext: { channelId: "bc/store/channel/${channelId}", locale: "${locale.code}" }) {
                              displayName
                              ... on CheckboxProductModifierForLocale {
                                fieldValue
                              }
                            }
                            `
                          ).join('')}
                        }
                        ... on TextFieldProductModifier {
                          defaultValue
                          ${availableLocales.map((locale) =>
                            locale.code === defaultLocale ? "" : `
                            ${locale.code}: overridesForLocale (localeContext: { channelId: "bc/store/channel/${channelId}", locale: "${locale.code}" }) {
                              displayName
                              ... on TextFieldProductModifierForLocale {
                                defaultValue
                              }
                            }
                            `
                          ).join('')}
                        }
                        ... on MultilineTextFieldProductModifier {
                          defaultValue
                          ${availableLocales.map((locale) =>
                            locale.code === defaultLocale ? "" : `
                            ${locale.code}: overridesForLocale (localeContext: { channelId: "bc/store/channel/${channelId}", locale: "${locale.code}" }) {
                              displayName
                              ... on MultilineTextFieldProductModifierForLocale {
                                defaultValue
                              }
                            }
                            `
                          ).join('')}
                        }
                        ... on NumbersOnlyTextFieldProductModifier {
                          defaultValueFloat: defaultValue
                          ${availableLocales.map((locale) =>
                            locale.code === defaultLocale ? "" : `
                            ${locale.code}: overridesForLocale (localeContext: { channelId: "bc/store/channel/${channelId}", locale: "${locale.code}" }) {
                              displayName
                              ... on NumbersOnlyTextFieldProductModifierForLocale {
                                defaultValueFloat: defaultValue
                              }
                            }
                            `
                          ).join('')}
                        }
                        ... on DropdownProductModifier {
                          values {
                            id
                            label
                            isDefault
                          }
                          ${availableLocales.map((locale) =>
                            locale.code === defaultLocale ? "" : `
                            ${locale.code}: overridesForLocale (localeContext: { channelId: "bc/store/channel/${channelId}", locale: "${locale.code}" }) {
                              displayName
                              values {
                                id
                                label
                              }
                            }
                            `
                          ).join('')}
                        }
                        ... on RadioButtonsProductModifier {
                          values {
                            id
                            label
                            isDefault
                          }
                          ${availableLocales.map((locale) =>
                            locale.code === defaultLocale ? "" : `
                            ${locale.code}: overridesForLocale (localeContext: { channelId: "bc/store/channel/${channelId}", locale: "${locale.code}" }) {
                              displayName
                              values {
                                id
                                label
                              }
                            }
                            `
                          ).join('')}
                        }
                        ... on RectangleListProductModifier {
                          values {
                            id
                            label
                            isDefault
                          }
                          ${availableLocales.map((locale) =>
                            locale.code === defaultLocale ? "" : `
                            ${locale.code}: overridesForLocale (localeContext: { channelId: "bc/store/channel/${channelId}", locale: "${locale.code}" }) {
                              displayName
                              values {
                                id
                                label
                              }
                            }
                            `
                          ).join('')}
                        }
                        ... on SwatchProductModifier {
                          values {
                            id
                            label
                            isDefault
                          }
                          ${availableLocales.map((locale) =>
                            locale.code === defaultLocale ? "" : `
                            ${locale.code}: overridesForLocale (localeContext: { channelId: "bc/store/channel/${channelId}", locale: "${locale.code}" }) {
                              displayName
                              values {
                                id
                                label
                              }
                            }
                            `
                          ).join('')}
                        }
                        ... on PickListProductModifier {
                          values {
                            id
                            label
                            isDefault
                          }
                          ${availableLocales.map((locale) =>
                            locale.code === defaultLocale ? "" : `
                            ${locale.code}: overridesForLocale (localeContext: { channelId: "bc/store/channel/${channelId}", locale: "${locale.code}" }) {
                              displayName
                              values {
                                id
                                label
                              }
                            }
                            `
                          ).join('')}
                        }
                        ... on FileUploadProductModifier {
                          ${availableLocales.map((locale) =>
                            locale.code === defaultLocale ? "" : `
                            ${locale.code}: overridesForLocale (localeContext: { channelId: "bc/store/channel/${channelId}", locale: "${locale.code}" }) {
                              displayName
                            }
                            `
                          ).join('')}
                        }
                        ... on DateFieldProductModifier {
                          ${availableLocales.map((locale) =>
                            locale.code === defaultLocale ? "" : `
                            ${locale.code}: overridesForLocale (localeContext: { channelId: "bc/store/channel/${channelId}", locale: "${locale.code}" }) {
                              displayName
                            }
                            `
                          ).join('')}
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
      `
    };
  },

  hardcodedQuery_updateProductLocaleData: (variables: any) => {
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

    const hasRemovedBasicInfo = variables.removedBasicInfoInput &&
      variables.removedBasicInfoInput.overridesToRemove &&
      variables.removedBasicInfoInput.overridesToRemove.length > 0;

    const hasRemovedSeo = variables.removedSeoInput &&
      variables.removedSeoInput.overridesToRemove &&
      variables.removedSeoInput.overridesToRemove.length > 0;

    const hasRemovedStorefrontDetails = variables.removedStorefrontDetailsInput &&
      variables.removedStorefrontDetailsInput.overridesToRemove &&
      variables.removedStorefrontDetailsInput.overridesToRemove.length > 0;

    const hasRemovedPreOrder = variables.removedPreOrderInput &&
      variables.removedPreOrderInput.overridesToRemove &&
      variables.removedPreOrderInput.overridesToRemove.length > 0;

    const hasRemovedCustomFields = variables.removedCustomFieldsInput &&
      variables.removedCustomFieldsInput.data &&
      variables.removedCustomFieldsInput.data.length > 0;

    return {
      query: `
        mutation (
          $channelId: ID!,
          $locale: String!,
          ${hasRemovedBasicInfo ? '$removedBasicInfoInput: RemoveProductBasicInformationOverridesInput!,' : ''}
          ${hasRemovedSeo ? '$removedSeoInput: RemoveProductSeoInformationOverridesInput!,' : ''}
          ${hasRemovedStorefrontDetails ? '$removedStorefrontDetailsInput: RemoveProductStorefrontDetailsOverridesInput!,' : ''}
          ${hasRemovedPreOrder ? '$removedPreOrderInput: RemoveProductPreOrderSettingsOverridesInput!,' : ''}
          ${hasRemovedOptions ? '$removedOptionsInput: RemoveProductOptionsOverridesInput!,' : ''}
          ${hasRemovedModifiers ? '$removedModifiersInput: RemoveProductModifiersOverridesInput!,' : ''}
          ${hasRemovedCustomFields ? '$removedCustomFieldsInput: RemoveProductCustomFieldsOverridesInput!,' : ''}
          $input: SetProductBasicInformationInput!,
          $seoInput: SetProductSeoInformationInput!,
          $preOrderInput: SetProductPreOrderSettingsInput!,
          $storefrontInput: SetProductStorefrontDetailsInput!
          ${hasOptions ? '$optionsInput: SetProductOptionsInformationInput!,' : ''}
          ${hasModifiers ? '$modifiersInput: SetProductModifiersInformationInput!,' : ''}
          ${hasCustomFields ? '$customFieldsInput: UpdateProductCustomFieldsInput!' : ''}
        ) {
          product {
            ${hasRemovedBasicInfo ? `
            removeProductBasicInformationOverrides(input: $removedBasicInfoInput) {
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
            ` : ''}
            ${hasRemovedSeo ? `
            removeProductSeoInformationOverrides(input: $removedSeoInput) {
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
            ` : ''}
            ${hasRemovedStorefrontDetails ? `
            removeProductStorefrontDetailsOverrides(input: $removedStorefrontDetailsInput) {
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
            ` : ''}
            ${hasRemovedPreOrder ? `
            removeProductPreOrderSettingsOverrides(input: $removedPreOrderInput) {
              product {
                overridesForLocale (localeContext: { channelId: $channelId, locale: $locale }) {
                  preOrderSettings {
                    message
                  }
                }
              }
            }
            ` : ''}
            ${hasRemovedCustomFields ? `
            removeProductCustomFieldsOverrides(input: $removedCustomFieldsInput) {
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
      `,
      variables
    };
  },

  getAllProducts: (variables: { limit: number, cursor?: string }) => ({
    query: `
      {
        store {
          products {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              cursor
              node {
                id
                basicInformation {
                  name
                  description
                }
              }
            }
          }
        }
      }
    `,
    variables
  }),
}; 