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
 * @param optionData - The posted option data.
 * @returns An array of transformed option data.
 */
function transformPostedOptionDataToGraphQLSchema(optionData: any) {
  if (!optionData.options) return [];

  return Object.entries(optionData.options).map(
    ([optionId, optionDetails]: [string, any]) => ({
      optionId,
      data: {
        dropdown: {
          displayName: optionDetails.displayName,
          values: Object.entries(optionDetails.values).map(
            ([valueId, label]) => ({
              valueId,
              label,
            })
          ),
        },
      },
    })
  );
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
 * Handles GET requests to retrieve product locale data.
 * @param request - The incoming request object.
 * @param params - The request parameters containing the product ID.
 * @returns A response with the product locale data or an error message.
 */
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
          const customFields =
          gqlData.data.store.products.edges[0].node?.customFields?.edges;

        normalizedProductData.localeData[locale.code] = {
          name: localeNode?.basicInformation?.name ?? null,
          description: localeNode?.basicInformation?.description ?? null,
          pageTitle: localeNode?.seoInformation?.pageTitle ?? null,
          metaDescription: localeNode?.seoInformation?.metaDescription ?? null,
          options: transformGraphQLOptionsDataToLocaleData(
            options,
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
      const productGraphData = createGraphFieldsFromPostData(
        body,
        "basicInformation"
      );
      const seoGraphData = createGraphFieldsFromPostData(
        body,
        "seoInformation"
      );
      const optionData = createGraphFieldsFromPostData(body, "options");
      const customFieldData = createGraphFieldsFromPostData(
        body,
        "customFields"
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
        optionsInput: {
          productId: `bc/store/product/${pid}`,
          localeContext: {
            channelId: `bc/store/channel/${channelId}`,
            locale: body.locale,
          },
          data: {
            options: transformPostedOptionDataToGraphQLSchema(optionData),
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
        options: transformGraphQLOptionsResponse(
          gqlData?.data?.product?.setProductOptionsInformation?.product?.options
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
