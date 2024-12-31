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
          },
          {
            "value": "Traduire",
            "localeCode": "fr-FR"
          },
          {
            "value": "Traducir",
            "localeCode": "es-419"
          },
          {
            "value": "Traduci",
            "localeCode": "it-IT"
          },
          {
            "value": "Перекласти",
            "localeCode": "uk-UA"
          },
          {
            "value": "翻译",
            "localeCode": "zh-CN"
          },
          {
            "value": "Vertalen",
            "localeCode": "nl-NL"
          },
          {
            "value": "Traduzir",
            "localeCode": "pt-BR"
          },
          {
            "value": "Översätt",
            "localeCode": "sv-SE"
          },
          {
            "value": "번역",
            "localeCode": "ko-KR"
          },
          {
            "value": "Oversæt",
            "localeCode": "da-DK"
          },
          {
            "value": "Oversett",
            "localeCode": "no-NO"
          },
          {
            "value": "Tłumacz",
            "localeCode": "pl-PL"
          },
          {
            "value": "翻訳",
            "localeCode": "ja-JP"
          },
          {
            "value": "Traducir",
            "localeCode": "es-ES"
          }
        ]
      }
    }
  }
});
