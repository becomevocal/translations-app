// Types
export type AppExtensionContext = 'PANEL' | 'BUTTON' | 'FULL_PAGE';
export type AppExtensionModel = 'PRODUCTS' | 'CATEGORIES' | 'ORDERS' | 'CUSTOMERS';

export interface AppExtensionLabel {
  defaultValue: string;
  locales?: {
    value: string;
    localeCode: string;
  }[];
}

export type CreateAppExtension = {
    context: AppExtensionContext;
    model: AppExtensionModel;
    url: string;
    label: AppExtensionLabel;
  };

export interface AppExtension {
  id: string;
  context: AppExtensionContext;
  model: AppExtensionModel;
  url: string;
  label?: AppExtensionLabel;
}

export interface AppExtensionResponse {
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

export interface AppExtensionCreateResponse {
  data: {
    appExtension: {
      createAppExtension: {
        appExtension: AppExtension;
      };
    };
  };
}

export interface AppExtensionUpdateResponse {
  data: {
    appExtension: {
      updateAppExtension: {
        appExtension: AppExtension;
      };
    };
  };
}

export interface AppExtensionDeleteResponse {
  data: {
    appExtension: {
      deleteAppExtension: {
        deletedAppExtensionId: string;
      };
    };
  };
}

// Queries and Mutations
export const appExtensionQueries = {
  getAppExtensions: () => ({
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
  }),

  createAppExtension: ({ context, model, url, label }: { 
    context: AppExtensionContext, 
    model: AppExtensionModel, 
    url: string, 
    label: AppExtensionLabel 
  }) => ({
    query: `
      mutation AppExtension($input: CreateAppExtensionInput!) {
        appExtension {
          createAppExtension(input: $input) {
            appExtension {
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
      }`,
    variables: {
      input: {
        context,
        model,
        url,
        label,
      },
    },
  }),

  updateAppExtension: ({ id, input }: { 
    id: string, 
    input: { label: AppExtensionLabel } 
  }) => ({
    query: `
      mutation UpdateAppExtension($input: UpdateAppExtensionInput!) {
        appExtension {
          updateAppExtension(input: $input) {
            appExtension {
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
      }`,
    variables: {
      input: {
        id,
        data: input,
      },
    },
  }),

  deleteAppExtension: (id: string) => ({
    query: `
      mutation {
        appExtension {
          deleteAppExtension(input: { id: "${id}" }) {
            deletedAppExtensionId
          }
        }
      }`,
  }),
}; 