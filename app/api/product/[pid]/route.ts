import { type NextRequest } from "next/server";
import { bigcommerceClient, getSession } from "@/lib/auth";
import {
  availableLocales,
  defaultLocale,
  translatableProductFields,
} from "@/lib/constants";
import { debugLog } from "@/lib/debug";
import { createGraphQLClient } from "@/lib/graphql-client";
import { debuglog } from "util";

/**
 * Creates a mapping of GraphQL fields from the provided posted form data.
 * @param postData - The post data containing key-value pairs.
 * @param graphqlParentObject - The parent object in the GraphQL schema.
 * @returns A mapping of GraphQL fields.
 */
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

/**
 * Transforms GraphQL options data to locale-specific data.
 * @param optionsData - The GraphQL options data.
 * @param localeCode - The locale code to transform data for.
 * @returns Transformed locale-specific options data.
 */
function transformGraphQLOptionsDataToLocaleData(
  optionsData: any,
  localeCode: string
) {
  // Ensure we're working with an array of edges
  const options = optionsData?.edges || optionsData || [];

  return options.reduce((acc: any, edge: any) => {
    const optionId = edge.node.id;
    const localeOption = edge.node[localeCode];

    acc[optionId] = {
      displayName: localeOption?.displayName || "",
      values: {},
    };

    edge.node.values.forEach((value: any) => {
      const localeValue = localeOption?.values?.find(
        (v: any) => v.id === value.id
      );
      acc[optionId].values[value.id] = localeValue?.label || "";
    });

    return acc;
  }, {});
}

/**
 * Transforms posted option data to match the GraphQL schema.
 * @param optionData - The posted option data containing options with their display names and values
 * @returns {Object} An object containing:
 *   - options: Array of transformed options with their IDs, display names, and non-empty values
 *   - removedValues: Array of options and values to remove from overrides
 */
function transformPostedOptionDataToGraphQLSchema(optionData: any) {
  if (!optionData.options) return { options: [], removedValues: [] };

  const removedValues: any[] = [];
  
  const options = Object.entries(optionData.options)
    .map(([optionId, optionDetails]: [string, any]) => {
      // Track empty values
      const emptyValueIds: string[] = [];
      Object.entries(optionDetails.values).forEach(([valueId, label]) => {
        if (!label || (label as string).trim() === '') {
          emptyValueIds.push(valueId);
        }
      });

      if (emptyValueIds.length > 0) {
        removedValues.push({
          optionId,
          data: {
            dropdown: {
              ...((!optionDetails.displayName || optionDetails.displayName.trim() === '') && {
                fields: ["DROPDOWN_PRODUCT_OPTION_DISPLAY_NAME_FIELD"]
              }),
              values: {
                ids: emptyValueIds
              }
            }
          }
        });
      }

      const nonEmptyValues = Object.entries(optionDetails.values).reduce((acc: any[], [valueId, label]) => {
        if (!label || (label as string).trim() === '') {
          return acc;
        }
        acc.push({ valueId, label });
        return acc;
      }, []);

      // Only return the option if it has a non-empty display name or non-empty values
      const displayName = optionDetails.displayName?.trim();
      if (displayName || nonEmptyValues.length > 0) {
        return {
          optionId,
          data: {
            dropdown: {
              // An empty or null displayName will throw an error, so remove it if it's empty
              ...(displayName && { displayName }),
              ...(nonEmptyValues.length > 0 && { values: nonEmptyValues }),
            },
          },
        };
      }
      return null;
    })
    .filter(Boolean); // Remove null entries

  return { options, removedValues };
}

/**
 * Transforms GraphQL options response to a simplified object.
 * @param optionsData - The GraphQL options response data.
 * @returns A simplified object of options data.
 */
function transformGraphQLOptionsResponse(optionsData: any) {
  if (!optionsData?.edges) return {};

  return optionsData.edges.reduce((acc: any, edge: any) => {
    const optionId = edge.node.id;
    const localeData = edge.node.overridesForLocale;

    acc[optionId] = {
      displayName: localeData?.displayName || "",
      values: {},
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

/**
 * Transforms GraphQL custom fields response to a simplified object.
 * @param customFieldsData - The GraphQL custom fields response data.
 * @returns A simplified object of custom fields data.
 */
function transformGraphQLCustomFieldsResponse(customFieldsData: any) {
  if (!customFieldsData?.edges) return {};

  return customFieldsData.edges.reduce((acc: any, edge: any) => {
    
    const customFieldId = edge.node.id;
    const localeData = edge.node.overrides;

    acc[customFieldId] = {
      name: localeData?.edges?.[0]?.node?.name || "",
      value: localeData?.edges?.[0]?.node?.value || "",
    };

    return acc;
  }, {});
}

/**
 * Transforms GraphQL custom fields data to locale-specific data.
 * @param customFieldsData - The GraphQL custom fields data.
 * @param localeCode - The locale code to transform data for.
 * @returns Transformed locale-specific custom fields data.
 */
function transformGraphQLCustomFieldsDataToLocaleData(
  customFieldsData: any,
  localeCode: string
) {
  // Ensure we're working with an array
  const customFields = customFieldsData || [];

  return customFields.reduce((acc: any, field: any) => {
    const fieldId = field.node.id;
    const localeData = field.node[localeCode]?.edges?.[0]?.node || {};

    acc[fieldId] = {
      name: localeData?.name || "",
      value: localeData?.value || "",
    };

    return acc;
  }, {});
}

/**
 * Transforms posted custom field data to match the GraphQL schema.
 * @param customFieldData - The posted custom field data.
 * @param channelId - The channel ID for the data.
 * @param locale - The locale for the data.
 * @returns An array of transformed custom field data.
 */
function transformPostedCustomFieldDataToGraphQLSchema(
  customFieldData: any,
  channelId: string,
  locale: string
) {
  if (!customFieldData.customFields) return [];

  return Object.entries(customFieldData.customFields).map(
    ([fieldId, fieldDetails]: [string, any]) => ({
      customFieldId: fieldId,
      overrides: [
        {
          channelLocaleOverrides: {
            context: {
              channelId: `bc/store/channel/${channelId}`,
              locale: locale,
            },
            data: {
              name: fieldDetails.name || null,
              value: fieldDetails.value || null,
              isVisible: true,
            },
          },
        },
      ],
    })
  );
}

/**
 * Transforms GraphQL modifiers data to locale-specific data.
 * @param modifiersData - The GraphQL modifiers data.
 * @param localeCode - The locale code to transform data for.
 * @returns Transformed locale-specific modifiers data.
 */
function transformGraphQLModifiersDataToLocaleData(
  modifiersData: any,
  localeCode: string
) {
  // Ensure we're working with an array of edges
  const modifiers = modifiersData?.edges || modifiersData || [];

  return modifiers.reduce((acc: any, edge: any) => {
    const modifierId = edge.node.id;
    const localeModifier = edge.node[localeCode];
    const modifierType = edge.node.__typename;

    acc[modifierId] = {
      __typename: modifierType,
      displayName: localeModifier?.displayName || "",
    };

    // Handle type-specific fields
    switch (modifierType) {
      case 'CheckboxProductModifier':
        acc[modifierId].fieldValue = localeModifier?.fieldValue || "";
        break;
      case 'TextFieldProductModifier':
      case 'MultilineTextFieldProductModifier':
        acc[modifierId].defaultValue = localeModifier?.defaultValue || "";
        break;
      case 'NumbersOnlyTextFieldProductModifier':
        acc[modifierId].defaultValue = localeModifier?.defaultValueFloat || null;
        break;
      case 'DropdownProductModifier':
      case 'RadioButtonsProductModifier':
      case 'RectangleListProductModifier':
      case 'SwatchProductModifier':
      case 'PickListProductModifier':
        acc[modifierId].values = {};
        // Handle modifiers with values
        if (edge.node.values) {
          edge.node.values.forEach((value: any) => {
            const localeValue = localeModifier?.values?.find(
              (v: any) => v.id === value.id
            );
            acc[modifierId].values[value.id] = localeValue?.label || "";
          });
        }
        break;
      // FileUpload and DateField only need displayName, which is already set
    }

    return acc;
  }, {});
}

/**
 * Transforms posted modifier data to match the GraphQL schema.
 * @param modifierData - The posted modifier data containing modifiers with their display names and values
 * @returns {Object} An object containing:
 *   - modifiers: Array of transformed modifiers with their IDs, display names, and non-empty values
 *   - removedValues: Array of modifiers and values to remove from overrides
 */
function transformPostedModifierDataToGraphQLSchema(modifierData: any) {
  if (!modifierData.modifiers) return { modifiers: [], removedValues: [] };

  const removedValues: any[] = [];
  
  const modifiers = Object.entries(modifierData.modifiers)
    .map(([modifierId, modifierDetails]: [string, any]) => {
      // Track empty values
      const emptyValueIds: string[] = [];
      if (modifierDetails.values) {
        Object.entries(modifierDetails.values).forEach(([valueId, label]) => {
          if (!label || (label as string).trim() === '') {
            emptyValueIds.push(valueId);
          }
        });
      }

      if (emptyValueIds.length > 0 || (!modifierDetails.displayName || modifierDetails.displayName.trim() === '')) {
        const modifierType = modifierDetails.__typename;
        let data: any = {};

        // Handle different modifier types for removal
        switch (modifierType) {
          case 'CheckboxProductModifier':
            data = {
              checkbox: {
                fields: []
              }
            };
            if (!modifierDetails.displayName || modifierDetails.displayName.trim() === '') {
              data.checkbox.fields.push("CHECKBOX_PRODUCT_MODIFIER_DISPLAY_NAME_FIELD");
            }
            if (modifierDetails.fieldValue === '') {
              data.checkbox.fields.push("CHECKBOX_PRODUCT_MODIFIER_VALUE_FIELD");
            }
            break;
          case 'TextFieldProductModifier':
            data = {
              textField: {
                fields: []
              }
            };
            if (!modifierDetails.displayName || modifierDetails.displayName.trim() === '') {
              data.textField.fields.push("TEXT_FIELD_PRODUCT_MODIFIER_DISPLAY_NAME_FIELD");
            }
            if (modifierDetails.defaultValue === '') {
              data.textField.fields.push("TEXT_FIELD_PRODUCT_MODIFIER_DEFAULT_VALUE_FIELD");
            }
            break;
          case 'MultilineTextFieldProductModifier':
            data = {
              multiLineTextField: {
                fields: []
              }
            };
            if (!modifierDetails.displayName || modifierDetails.displayName.trim() === '') {
              data.multiLineTextField.fields.push("MULTILINE_TEXT_FIELD_PRODUCT_MODIFIER_DISPLAY_NAME_FIELD");
            }
            if (modifierDetails.defaultValue === '') {
              data.multiLineTextField.fields.push("MULTILINE_TEXT_FIELD_PRODUCT_MODIFIER_DEFAULT_VALUE_FIELD");
            }
            break;
          case 'NumbersOnlyTextFieldProductModifier':
            data = {
              numberField: {
                fields: []
              }
            };
            if (!modifierDetails.displayName || modifierDetails.displayName.trim() === '') {
              data.numberField.fields.push("NUMBER_FIELD_PRODUCT_MODIFIER_DISPLAY_NAME_FIELD");
            }
            if (modifierDetails.defaultValue === '') {
              data.numberField.fields.push("NUMBER_FIELD_PRODUCT_MODIFIER_DEFAULT_VALUE_FIELD");
            }
            break;
          case 'DateFieldProductModifier':
            data = {
              dateField: {
                fields: []
              }
            };
            if (!modifierDetails.displayName || modifierDetails.displayName.trim() === '') {
              data.dateField.fields.push("DATE_FIELD_PRODUCT_MODIFIER_DISPLAY_NAME_FIELD");
            }
            break;
          case 'FileUploadProductModifier':
            data = {
              fileUpload: {
                fields: []
              }
            };
            if (!modifierDetails.displayName || modifierDetails.displayName.trim() === '') {
              data.fileUpload.fields.push("FILE_UPLOAD_PRODUCT_MODIFIER_DISPLAY_NAME_FIELD");
            }
            break;
          case 'DropdownProductModifier':
            data = {
              dropdown: {
                fields: []
              }
            };
            if (!modifierDetails.displayName || modifierDetails.displayName.trim() === '') {
              data.dropdown.fields.push("DROPDOWN_PRODUCT_MODIFIER_DISPLAY_NAME_FIELD");
            }
            if (emptyValueIds.length > 0) {
              data.dropdown.values = {
                ids: emptyValueIds
              };
            }
            break;
          case 'RadioButtonsProductModifier':
            data = {
              radioButtons: {
                fields: []
              }
            };
            if (!modifierDetails.displayName || modifierDetails.displayName.trim() === '') {
              data.radioButtons.fields.push("RADIO_BUTTONS_PRODUCT_MODIFIER_DISPLAY_NAME_FIELD");
            }
            if (emptyValueIds.length > 0) {
              data.radioButtons.values = {
                ids: emptyValueIds
              };
            }
            break;
          case 'RectangleListProductModifier':
            data = {
              rectangleList: {
                fields: []
              }
            };
            if (!modifierDetails.displayName || modifierDetails.displayName.trim() === '') {
              data.rectangleList.fields.push("RECTANGLE_LIST_PRODUCT_MODIFIER_DISPLAY_NAME_FIELD");
            }
            if (emptyValueIds.length > 0) {
              data.rectangleList.values = {
                ids: emptyValueIds
              };
            }
            break;
          case 'SwatchProductModifier':
            data = {
              swatch: {
                fields: []
              }
            };
            if (!modifierDetails.displayName || modifierDetails.displayName.trim() === '') {
              data.swatch.fields.push("SWATCH_PRODUCT_MODIFIER_DISPLAY_NAME_FIELD");
            }
            if (emptyValueIds.length > 0) {
              data.swatch.values = {
                ids: emptyValueIds
              };
            }
            break;
          case 'PickListProductModifier':
            data = {
              pickList: {
                fields: []
              }
            };
            if (!modifierDetails.displayName || modifierDetails.displayName.trim() === '') {
              data.pickList.fields.push("PICK_LIST_PRODUCT_MODIFIER_DISPLAY_NAME_FIELD");
            }
            if (emptyValueIds.length > 0) {
              data.pickList.values = {
                ids: emptyValueIds
              };
            }
            break;
          default:
            // If we don't know the type, try to infer it based on the data
            if (modifierDetails.values) {
              data = {
                dropdown: {
                  fields: []
                }
              };
              if (!modifierDetails.displayName || modifierDetails.displayName.trim() === '') {
                data.dropdown.fields.push("DROPDOWN_PRODUCT_MODIFIER_DISPLAY_NAME_FIELD");
              }
              if (emptyValueIds.length > 0) {
                data.dropdown.values = {
                  ids: emptyValueIds
                };
              }
            } else {
              data = {
                textField: {
                  fields: []
                }
              };
              if (!modifierDetails.displayName || modifierDetails.displayName.trim() === '') {
                data.textField.fields.push("TEXT_FIELD_PRODUCT_MODIFIER_DISPLAY_NAME_FIELD");
              }
            }
        }

        // Only add to removedValues if we have fields or values to remove
        const dataType = Object.keys(data)[0];
        if (data[dataType].fields?.length > 0 || data[dataType].values?.ids?.length > 0) {
          removedValues.push({
            modifierId,
            data
          });
        }
      }

      // Only return the modifier if it has a non-empty display name or non-empty values
      const displayName = modifierDetails.displayName?.trim();
      if (displayName || (modifierDetails.values && Object.values(modifierDetails.values).some(v => v))) {
        const modifierType = modifierDetails.__typename;
        let data: any = {};

        // Handle different modifier types
        switch (modifierType) {
          case 'CheckboxProductModifier':
            data = {
              checkbox: {
                ...(displayName && { displayName }),
                // The GraphQL API returns an error if "value" field is not provided
                value: modifierDetails.fieldValue || ''
              }
            };
            break;
          case 'TextFieldProductModifier':
            data = {
              textField: {
                ...(displayName && { displayName }),
                ...(modifierDetails.defaultValue && { defaultValue: modifierDetails.defaultValue })
              }
            };
            break;
          case 'MultilineTextFieldProductModifier':
            data = {
              multiLineTextField: {
                ...(displayName && { displayName }),
                ...(modifierDetails.defaultValue && { defaultValue: modifierDetails.defaultValue })
              }
            };
            break;
          case 'NumbersOnlyTextFieldProductModifier':
            data = {
              numberField: {
                ...(displayName && { displayName }),
                ...(modifierDetails.defaultValue && { defaultValue: parseFloat(modifierDetails.defaultValue) })
              }
            };
            break;
          case 'DateFieldProductModifier':
            data = {
              dateField: {
                displayName
              }
            };
            break;
          case 'FileUploadProductModifier':
            data = {
              fileUpload: {
                displayName
              }
            };
            break;
          case 'DropdownProductModifier':
            data = {
              dropdown: {
                ...(displayName && { displayName }),
                ...(modifierDetails.values && { values: Object.entries(modifierDetails.values)
                  .filter(([_, label]) => label && (label as string).trim())
                  .map(([valueId, label]) => ({ valueId, label }))
                })
              }
            };
            break;
          case 'RadioButtonsProductModifier':
            data = {
              radioButtons: {
                ...(displayName && { displayName }),
                ...(modifierDetails.values && { values: Object.entries(modifierDetails.values)
                  .filter(([_, label]) => label && (label as string).trim())
                  .map(([valueId, label]) => ({ valueId, label }))
                })
              }
            };
            break;
          case 'RectangleListProductModifier':
            data = {
              rectangleList: {
                ...(displayName && { displayName }),
                ...(modifierDetails.values && { values: Object.entries(modifierDetails.values)
                  .filter(([_, label]) => label && (label as string).trim())
                  .map(([valueId, label]) => ({ valueId, label }))
                })
              }
            };
            break;
          case 'SwatchProductModifier':
            data = {
              swatch: {
                ...(displayName && { displayName }),
                ...(modifierDetails.values && { values: Object.entries(modifierDetails.values)
                  .filter(([_, label]) => label && (label as string).trim())
                  .map(([valueId, label]) => ({ valueId, label }))
                })
              }
            };
            break;
          case 'PickListProductModifier':
            data = {
              pickList: {
                ...(displayName && { displayName }),
                ...(modifierDetails.values && { values: Object.entries(modifierDetails.values)
                  .filter(([_, label]) => label && (label as string).trim())
                  .map(([valueId, label]) => ({ valueId, label }))
                })
              }
            };
            break;
          default:
            // If we don't know the type, try to infer it based on the data
            if (modifierDetails.values) {
              data = {
                dropdown: {
                  ...(displayName && { displayName }),
                  ...(modifierDetails.values && { values: Object.entries(modifierDetails.values)
                    .filter(([_, label]) => label && (label as string).trim())
                    .map(([valueId, label]) => ({ valueId, label }))
                  })
                }
              };
            } else {
              data = {
                textField: {
                  displayName
                }
              };
            }
        }

        return {
          modifierId,
          data
        };
      }
      return null;
    })
    .filter(Boolean); // Remove null entries

  return { modifiers, removedValues };
}

/**
 * Transforms GraphQL modifiers response to a simplified object.
 * @param modifiersData - The GraphQL modifiers response data.
 * @returns A simplified object of modifiers data.
 */
function transformGraphQLModifiersResponse(modifiersData: any) {
  if (!modifiersData?.edges) return {};

  return modifiersData.edges.reduce((acc: any, edge: any) => {
    const modifierId = edge.node.id;
    const localeData = edge.node.overridesForLocale;
    const modifierType = edge.node.__typename;

    acc[modifierId] = {
      __typename: modifierType,
      displayName: localeData?.displayName || "",
    };

    // Handle type-specific fields
    switch (modifierType) {
      case 'CheckboxProductModifier':
        acc[modifierId].fieldValue = localeData?.fieldValue || "";
        break;
      case 'TextFieldProductModifier':
      case 'MultilineTextFieldProductModifier':
        acc[modifierId].defaultValue = localeData?.defaultValue || "";
        break;
      case 'NumbersOnlyTextFieldProductModifier':
        acc[modifierId].defaultValue = localeData?.defaultValueFloat || null;
        break;
      case 'DropdownProductModifier':
      case 'RadioButtonsProductModifier':
      case 'RectangleListProductModifier':
      case 'SwatchProductModifier':
      case 'PickListProductModifier':
        acc[modifierId].values = {};
        // Transform values array into object with id as key
        if (localeData?.values) {
          localeData.values.forEach((value: any) => {
            acc[modifierId].values[value.id] = value.label;
          });
        }
        break;
      // FileUpload and DateField only need displayName, which is already set
    }

    return acc;
  }, {});
}

/**
 * Handles GET requests to retrieve product locale data.
 * @param request - The incoming request object.
 * @param params - The request parameters containing the product ID.
 * @returns A response with the product locale data or an error message.
 */
export async function GET(request: NextRequest, props: { params: Promise<{ pid: string }> }) {
  const params = await props.params;
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

    const gqlData = await graphQLClient.getProductLocaleData({
      pid,
      channelId,
      availableLocales,
      defaultLocale,
    });

    if (!gqlData?.data?.store?.products?.edges?.[0]?.node) {
      debugLog(gqlData, "GET-error-response-");
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
      preOrderMessage: productNode.preOrderSettings?.message,
      warranty: productNode.storefrontDetails?.warranty,
      availabilityDescription: productNode.storefrontDetails?.availabilityDescription,
      searchKeywords: productNode.storefrontDetails?.searchKeywords,
      options: {
        edges: (productNode.options?.edges || []).map((edge: any) => ({
          node: {
            id: edge.node?.id,
            displayName: edge.node?.displayName,
            values: (edge.node?.values || []).map((value: any) => ({
              id: value?.id,
              label: value?.label,
            })),
          },
        })),
      },
      modifiers: {
        edges: (productNode.modifiers?.edges || []).map((edge: any) => ({
          node: {
            id: edge.node?.id,
            displayName: edge.node?.displayName,
            values: (edge.node?.values || []).map((value: any) => ({
              id: value?.id,
              label: value?.label,
            })),
          },
        })),
      },
      customFields: {
        edges: (productNode.customFields?.edges || []).map((edge: any) => ({
          node: {
            id: edge.node?.id,
            name: edge.node?.name,
            value: edge.node?.value,
            overridesForLocale: edge.node?.overridesForLocale,
          },
        })),
      },
      localeData: {} as { [key: string]: any },
    };

    availableLocales.forEach((locale) => {
      if (defaultLocale !== locale.code) {
        const localeNode =
          gqlData.data.store.products.edges[0].node[locale.code];
        const options =
          gqlData.data.store.products.edges[0].node?.options?.edges;
        const modifiers =
          gqlData.data.store.products.edges[0].node?.modifiers?.edges;
        const customFields =
          gqlData.data.store.products.edges[0].node?.customFields?.edges;

        normalizedProductData.localeData[locale.code] = {
          name: localeNode?.basicInformation?.name ?? null,
          description: localeNode?.basicInformation?.description ?? null,
          pageTitle: localeNode?.seoInformation?.pageTitle ?? null,
          metaDescription: localeNode?.seoInformation?.metaDescription ?? null,
          preOrderMessage: localeNode?.preOrderSettings?.message ?? null,
          warranty: localeNode?.storefrontDetails?.warranty ?? null,
          availabilityDescription: localeNode?.storefrontDetails?.availabilityDescription ?? null,
          searchKeywords: localeNode?.storefrontDetails?.searchKeywords ?? null,
          options: transformGraphQLOptionsDataToLocaleData(
            options,
            locale.code
          ),
          modifiers: transformGraphQLModifiersDataToLocaleData(
            modifiers,
            locale.code
          ),
          customFields: transformGraphQLCustomFieldsDataToLocaleData(
            customFields,
            locale.code
          ),
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

/**
 * Handles PUT requests to update product locale data.
 * @param request - The incoming request object.
 * @param params - The request parameters containing the product ID.
 * @returns A response with the updated product data or an error message.
 */
export async function PUT(request: NextRequest, props: { params: Promise<{ pid: string }> }) {
  const params = await props.params;
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
      const productGraphData = createGraphFieldsFromPostData(
        body,
        "basicInformation"
      );
      const seoGraphData = createGraphFieldsFromPostData(
        body,
        "seoInformation"
      );
      const optionData = createGraphFieldsFromPostData(body, "options");
      const modifierData = createGraphFieldsFromPostData(body, "modifiers");
      const customFieldData = createGraphFieldsFromPostData(
        body,
        "customFields"
      );

      const preOrderGraphData = createGraphFieldsFromPostData(
        body,
        "preOrderSettings"
      );

      const storefrontGraphData = createGraphFieldsFromPostData(
        body,
        "storefrontDetails"
      );

      const graphVariables = {
        channelId: `bc/store/channel/${channelId}`,
        locale: body.locale,
        input: {
          productId: `bc/store/product/${pid}`,
          localeContext: {
            channelId: `bc/store/channel/${channelId}`,
            locale: body.locale,
          },
          data: productGraphData,
        },
        seoInput: {
          productId: `bc/store/product/${pid}`,
          localeContext: {
            channelId: `bc/store/channel/${channelId}`,
            locale: body.locale,
          },
          data: seoGraphData,
        },
        preOrderInput: {
          productId: `bc/store/product/${pid}`,
          localeContext: {
            channelId: `bc/store/channel/${channelId}`,
            locale: body.locale,
          },
          data: {
            message: preOrderGraphData.preOrderMessage
          }
        },
        storefrontInput: {
          productId: `bc/store/product/${pid}`,
          localeContext: {
            channelId: `bc/store/channel/${channelId}`,
            locale: body.locale,
          },
          data: {
            warranty: storefrontGraphData.warranty,
            availabilityDescription: storefrontGraphData.availabilityDescription,
            searchKeywords: storefrontGraphData.searchKeywords
          }
        },
        removedOptionsInput: {
          productId: `bc/store/product/${pid}`,
          localeContext: {
            channelId: `bc/store/channel/${channelId}`,
            locale: body.locale,
          },
          data: {
            options: transformPostedOptionDataToGraphQLSchema(optionData).removedValues
          }
        },
        optionsInput: {
          productId: `bc/store/product/${pid}`,
          localeContext: {
            channelId: `bc/store/channel/${channelId}`,
            locale: body.locale,
          },
          data: {
            options: transformPostedOptionDataToGraphQLSchema(optionData).options,
          },
        },
        removedModifiersInput: {
          productId: `bc/store/product/${pid}`,
          localeContext: {
            channelId: `bc/store/channel/${channelId}`,
            locale: body.locale,
          },
          data: {
            modifiers: transformPostedModifierDataToGraphQLSchema(modifierData).removedValues
          }
        },
        modifiersInput: {
          productId: `bc/store/product/${pid}`,
          localeContext: {
            channelId: `bc/store/channel/${channelId}`,
            locale: body.locale,
          },
          data: {
            modifiers: transformPostedModifierDataToGraphQLSchema(modifierData).modifiers,
          },
        },
        customFieldsInput: {
          productId: `bc/store/product/${pid}`,
          data: transformPostedCustomFieldDataToGraphQLSchema(
            customFieldData,
            channelId,
            body.locale
          ),
        },
      };

      const gqlData = await graphQLClient.updateProductLocaleData(
        {
          pid,
          channelId,
          locale: body.locale,
        },
        graphVariables
      );

      result = {
        ...gqlData?.data?.product?.setProductBasicInformation?.product
          ?.overridesForLocale?.basicInformation,
        ...gqlData?.data?.product?.setProductSeoInformation?.product
          ?.overridesForLocale?.seoInformation,
        preOrderMessage: gqlData?.data?.product?.setProductPreOrderSettings?.product
          ?.overridesForLocale?.preOrderSettings?.message,
        ...gqlData?.data?.product?.setProductStorefrontDetails?.product
          ?.overridesForLocale?.storefrontDetails,
        options: transformGraphQLOptionsResponse(
          gqlData?.data?.product?.setProductOptionsInformation?.product?.options
        ),
        modifiers: transformGraphQLModifiersResponse(
          gqlData?.data?.product?.setProductModifiersInformation?.product?.modifiers
        ),
        customFields: transformGraphQLCustomFieldsResponse(
          gqlData?.data?.product?.updateProductCustomFields?.product
            ?.customFields
        ),
      };
    } else {
      // This is for the default lang, so update the main product
      // (currently the front-end does not allow this)
      const { data: updatedProduct } = await bigcommerceClient(
        accessToken,
        storeHash
      ).put(`/catalog/products/${pid}`, body);
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

