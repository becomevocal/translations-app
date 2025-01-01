const BIGCOMMERCE_API_URL = 'https://api.bigcommerce.com';

type AppExtension = {
  id: string;
  context: 'PANEL' | 'BUTTON' | 'FULL_PAGE';
  model: 'PRODUCTS' | 'CATEGORIES' | 'ORDERS' | 'CUSTOMERS';
  url: string;
  label?: {
    defaultValue: string;
    locales?: {
      value: string;
      localeCode: string;
    }[];
  };
  status: 'ACTIVE' | 'INACTIVE';
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface AppExtensionResponse {
  data: {
    store: {
      appExtensions: {
        edges: {
          node: AppExtension;
        }[];
      };
    };
  };
}

interface AppExtensionProps {
  accessToken: string;
  storeHash: string;
}

const getAppExtensionsQuery = () => ({
  query: `
      query {
          store {
              appExtensions {
                  edges {
                      node {
                          id
                          context
                          model
                          url
                          label {
                              defaultValue
                              locales {
                                  value
                                  localeCode
                              }
                          }
                      }
                  }
              }
          }
      }`,
});

const createAppExtensionMutation = ({ context, model, url, label }: { context: AppExtension["context"], model: AppExtension["model"], url: AppExtension["url"], label: AppExtension["label"] }) => ({
  "query": "mutation AppExtension($input: CreateAppExtensionInput!) { appExtension { createAppExtension(input: $input) { appExtension { id context model url label { defaultValue locales { value localeCode } } } } } }",
  "variables": {
    "input": {
      context,
      model,
      url,
      label
    }
  }
});

const updateAppExtensionMutation = ({ id, input }: { id: string, input: { label: AppExtension["label"] } }) => ({
  "query": "mutation UpdateAppExtension($input: UpdateAppExtensionInput!) { appExtension { updateAppExtension(input: $input) { appExtension { id context model url label { defaultValue locales { value localeCode } } } } } }",
  "variables": {
    "input": {
      id,
      data: input
    }
  }
});

export const createAppExtension = async ({
  accessToken,
  storeHash,
}: AppExtensionProps) => {
  // First check for existing extensions
  const existingExtensions = await getAppExtensions({ accessToken, storeHash });

  const appExtensionToCreate = {
    "context": "PANEL" as AppExtension["context"],
    "model": "PRODUCTS" as AppExtension["model"],
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
  
  // Find all matching extensions
  const matchingExtensions = existingExtensions.filter(extension => 
    extension.node.context === appExtensionToCreate.context && 
    extension.node.model === appExtensionToCreate.model &&
    extension.node.url === appExtensionToCreate.url
  );

  // If matching extensions exist
  if (matchingExtensions.length > 0) {
    // Keep the first one, delete any others
    const [firstExtension, ...duplicates] = matchingExtensions;
    
    // Delete duplicate extensions
    for (const duplicate of duplicates) {
      console.log(`Deleting duplicate app extension: ${duplicate.node.id}`);
      await deleteAppExtension({ 
        accessToken, 
        storeHash, 
        id: duplicate.node.id 
      });
    }

    // Update the label of the existing extension
    console.log('Updating existing app extension label');
    await updateAppExtension({
      accessToken,
      storeHash,
      id: firstExtension.node.id,
      input: {
        label: appExtensionToCreate.label
      }
    });

    console.log(`Using existing app extension: ${firstExtension.node.id}`);
    return firstExtension.node.id;
  }

  console.log('Creating new app extension');
  const appExtension = JSON.stringify(createAppExtensionMutation(appExtensionToCreate));
  
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

  const { errors, data } = await response.json();
  // console.log('Create extension response:', JSON.stringify({ errors, data }));

  if (errors && errors.length > 0) {
    throw new Error(errors[0]?.message);
  }

  return data?.appExtension?.createAppExtension?.appExtension?.id;
};

export const deleteAppExtension = async ({
  accessToken,
  storeHash,
  id,
}: AppExtensionProps & { id: string }) => {
  const deleteQuery = JSON.stringify({
    query: `mutation {
      appExtension {
        deleteAppExtension(input: { id: "${id}" }) {
          deletedAppExtensionId
        }
      }
    }`
  });

  const response = await fetch(
    `${BIGCOMMERCE_API_URL}/stores/${storeHash}/graphql`,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-auth-token': accessToken,
      },
      body: deleteQuery,
    }
  );

  const { errors, data } = await response.json();
  // console.log('Delete extension response:', JSON.stringify({ errors, data }));

  if (errors && errors.length > 0) {
    throw new Error(errors[0]?.message);
  }

  return data?.appExtension?.deleteAppExtension?.deletedAppExtensionId;
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

export const updateAppExtension = async ({
  accessToken,
  storeHash,
  id,
  input
}: AppExtensionProps & { 
  id: string, 
  input: { label: AppExtension["label"] } 
}) => {
  const appExtension = JSON.stringify(updateAppExtensionMutation({ id, input }));
  
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

  const { errors, data } = await response.json();
  // console.log('Update extension response:', JSON.stringify({ errors, data }));

  if (errors && errors.length > 0) {
    throw new Error(errors[0]?.message);
  }

  return data?.appExtension?.updateAppExtension?.appExtension;
};
