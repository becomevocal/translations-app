import { type NextRequest } from 'next/server'
import { bigcommerceClient, getSession } from "@/lib/auth";
import {
  availableLocales,
  defaultLocale,
  translatableProductFields,
} from "@/lib/constants";

const getMetafieldId = (metafields: any, fieldName: string, locale: string) => {
  const filteredFields = metafields.filter(
    (meta: any) => meta.namespace === locale && meta.key === fieldName
  );
  return filteredFields[0]?.id;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { pid: string } }
) {
  const pid = params.pid;
  const searchParams = request.nextUrl.searchParams
  const context = searchParams.get('context') ?? ''

  console.log('contextinroute (GET)', context, 'ex', params)

  try {
    const { accessToken, storeHash } = await getSession({ query: { context } });
    const bigcommerce = bigcommerceClient(accessToken, storeHash);

    const { data: productData } = await bigcommerce.get(
      `/catalog/products/${pid}`
    );
    const { data: metafieldsData } = await bigcommerce.get(
      `/catalog/products/${pid}/metafields`
    );

    const myHeaders = new Headers();
    myHeaders.append("X-Auth-Token", accessToken);
    myHeaders.append("Accept", " application/json");
    myHeaders.append("Content-Type", " application/json");

    const channelId = 1602127;

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
      }`;
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

    productData.localeData = {}
    availableLocales.forEach((locale) => {
      if (defaultLocale !== locale.code) {
        productData.localeData[locale.code] = gqlData.data.store.products.edges[0].node[locale.code]["basicInformation"];
      }
    });
    
    productData.metafields = metafieldsData;

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
  const searchParams = request.nextUrl.searchParams
  const context = searchParams.get('context') ?? ''

  console.log('contextinroute (PUT)', context, 'ex', params)

  try {
    let result: any;
    console.log('in route put', context)
    const { accessToken, storeHash } = await getSession({ query: { context } });
    console.log('after get session')
    const bigcommerce = bigcommerceClient(accessToken, storeHash);

    

    if (body["locale"] && body.locale !== defaultLocale) {
      const selectedLocale = body.locale;

      const myHeaders = new Headers();
      myHeaders.append("X-Auth-Token", accessToken);
      myHeaders.append("Accept", " application/json");
      myHeaders.append("Content-Type", " application/json");

      const channelId = 1602127;

      const mutationQuery = `
        mutation (
          $input: SetProductBasicInformationInput!
        ) {
          product {
            setProductBasicInformation(input: $input) {
              product {
                id
                ${selectedLocale}: overridesForLocale (localeContext: { channelId: "bc/store/channel/${1602127}", locale: "${selectedLocale}" }) {
                  basicInformation {
                    name
                    description
                  }
                }
              }
            }
          }
        }
      `;

      let updatedProductData = {} as any;
      for (const productField of translatableProductFields) {
        updatedProductData[productField.key] = body[productField.key];
      }

      const graphql = JSON.stringify({
        query: mutationQuery,
        variables: {
          input: {
            productId: `bc/store/product/${pid}`,
            localeContext: {
              channelId: `bc/store/channel/${channelId}`,
              locale: selectedLocale,
            },
            data: updatedProductData,
          },
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

      // This is for a localization, so create / update metafields
      // const { data: existingMetafields } = await bigcommerce.get(
      //   `/catalog/products/${pid}/metafields`
      // );

      // for (const productField of translatableProductFields) {
      //   let metafieldResults = [];
      //   const existingMetafieldId = getMetafieldId(
      //     existingMetafields,
      //     productField.key,
      //     selectedLocale
      //   );
      //   const metafieldValue = body[productField.key];

      //   if (existingMetafieldId) {
      //     // Update the metafield
      //     const { data } = await bigcommerce.put(
      //       `/catalog/products/${pid}/metafields/${existingMetafieldId}`,
      //       {
      //         value: metafieldValue,
      //       }
      //     );
      //     metafieldResults.push(data);
      //   } else {
      //     // Create the metafield, but only if there is a value (metafields cannot be created with empty values)
      //     if (metafieldValue !== "") {
      //       const { data } = await bigcommerce.post(
      //         `/catalog/products/${pid}/metafields`,
      //         {
      //           key: productField.key,
      //           value: metafieldValue,
      //           namespace: selectedLocale,
      //           permission_set: "write_and_sf_access",
      //         }
      //       );
      //       metafieldResults.push(data);
      //     }
      //   }

      //   result = metafieldResults;
      // }

      result =
        gqlData?.data?.product?.setProductBasicInformation?.product?.[
          selectedLocale
        ]?.basicInformation;
    } else {
      // This is for the default lang, so update the main product
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
