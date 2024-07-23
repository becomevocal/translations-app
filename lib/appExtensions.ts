const BIGCOMMERCE_API_URL = 'https://api.bigcommerce.com';

interface AppExtensionResponse {
  data: {
    store: {
      appExtensions: {
        edges: { node: { id: string } }[];
      };
    };
  };
}

interface AppExtensionProps {
  accessToken: string;
  storeHash: string;
}

export const createAppExtension = async ({
  accessToken,
  storeHash,
}: AppExtensionProps) => {
  console.log('createAppExtension', storeHash)
  const appExtension = JSON.stringify(createAppExtensionMutation());
  console.log('appExtension', appExtension)
  const response = await fetch(
    `${BIGCOMMERCE_API_URL}/stores/${storeHash}/graphql`,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-auth-token': accessToken,
      },
      body: appExtension,
    }
  );

  const { errors } = await response.json() as any;
  console.log(JSON.stringify(errors))

  if (errors && errors.length > 0) {
    throw new Error(errors[0]?.message);
  }
};

export const getAppExtensions = async ({
  accessToken,
  storeHash,
}: AppExtensionProps) => {
  const response = await fetch(
    `${BIGCOMMERCE_API_URL}/stores/${storeHash}/graphql`,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-auth-token': accessToken,
      },
      body: JSON.stringify(getAppExtensionsQuery()),
    }
  );

  const {
    data: {
      store: { appExtensions },
    },
  }: AppExtensionResponse = await response.json();

  return appExtensions.edges;
};

const getAppExtensionsQuery = () => ({
  query: `
      query {
          store {
              appExtensions {
                  edges {
                      node {
                          id
                      }
                  }
              }
          }
      }`,
});

const createAppExtensionMutation = () => ({
  "query": "mutation AppExtension($input: CreateAppExtensionInput!) { appExtension { createAppExtension(input: $input) { appExtension { id context model url label { defaultValue locales { value localeCode } } } } } }",
  "variables": {
    "input": {
      "context": "PANEL",
      "model": "PRODUCTS",
      "url": "/products/${id}",
      "label": {
        "defaultValue": "Translate",
        "locales": [
          {
            "value": "Translate",
            "localeCode": "en-US"
          },
          {
            "value": "Übersetzen",
            "localeCode": "de-DE"
          }
        ]
      }
    }
  }
});
