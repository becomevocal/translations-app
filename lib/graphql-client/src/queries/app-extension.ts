import { AppExtensionContext, AppExtensionModel, AppExtensionLabel } from '../types';

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