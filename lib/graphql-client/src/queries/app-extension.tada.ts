import { graphql } from '../graphql';
import type { AppExtensionContext, AppExtensionModel, AppExtensionLabel } from '../types';

// Get App Extensions Query
export const GetAppExtensionsDocument = graphql(`
  query GetAppExtensions {
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
  }
`);

// Create App Extension Mutation
export const CreateAppExtensionDocument = graphql(`
  mutation CreateAppExtension($input: CreateAppExtensionInput!) {
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
  }
`);

// Update App Extension Mutation
export const UpdateAppExtensionDocument = graphql(`
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
  }
`);

// Delete App Extension Mutation
export const DeleteAppExtensionDocument = graphql(`
  mutation DeleteAppExtension($id: ID!) {
    appExtension {
      deleteAppExtension(input: { id: $id }) {
        deletedAppExtensionId
      }
    }
  }
`);

// Helper function to create input for app extension mutations
export function createAppExtensionInput(params: {
  context: AppExtensionContext;
  model: AppExtensionModel;
  url: string;
  label: AppExtensionLabel;
}) {
  return {
    input: params
  };
}

// Helper function to create input for app extension update mutations
export function updateAppExtensionInput(params: {
  id: string;
  label: AppExtensionLabel;
}) {
  return {
    input: {
      id: params.id,
      data: {
        label: params.label
      }
    }
  };
} 