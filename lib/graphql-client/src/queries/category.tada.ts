import { graphql, ResultOf } from "../graphql";
import { formatChannelId } from "../utils";

// Get Categories Translations Query
export const GetCategoryTranslationsDocument = graphql(`
  query GetCategoryTranslations($channelId: ID!, $localeId: ID!) {
    store {
      translations(filters: {
        resourceType: CATEGORIES,
        channelId: $channelId,
        localeId: $localeId
      }) {
        edges {
          node {
            resourceId
            fields {
              fieldName
              original
              translation
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`);

// Update Category Translations Mutation
export const UpdateCategoryTranslationsDocument = graphql(`
  mutation UpdateCategoryTranslations($input: UpdateTranslationsInput!) {
    translation {
      updateTranslations(input: $input) {
        errors {
          ... on Error {
            message
          }
        }
      }
    }
  }
`);

// Delete Category Translations Mutation
export const DeleteCategoryTranslationsDocument = graphql(`
  mutation DeleteCategoryTranslations($input: DeleteTranslationsInput!) {
    translation {
      deleteTranslations(input: $input) {
        errors {
          ... on Error {
            message
          }
        }
      }
    }
  }
`);

// Helper function to create variables for updating category translations
export function createUpdateCategoryTranslationsVariables(params: {
  channelId: number;
  locale: string;
  categories: Array<{
    categoryId: number;
    fields: Array<{
      fieldName: string;
      value: string;
    }>
  }>
}) {
  return {
    input: {
      resourceType: "CATEGORIES",
      channelId: `bc/store/channel/${params.channelId}`,
      localeId: `bc/store/locale/${params.locale}`,
      entities: params.categories.map(category => ({
        resourceId: `bc/store/category/${category.categoryId}`,
        fields: category.fields
      }))
    }
  };
}

// Helper function to create variables for deleting category translations
export function createDeleteCategoryTranslationsVariables(params: {
  channelId: number;
  locale: string;
  categories: Array<{
    categoryId: number;
    fields: string[]
  }>
}) {
  return {
    input: {
      resourceType: "CATEGORIES",
      channelId: `bc/store/channel/${params.channelId}`,
      localeId: `bc/store/locale/${params.locale}`,
      resources: params.categories.map(category => ({
        resourceId: `bc/store/category/${category.categoryId}`,
        fields: category.fields
      }))
    }
  };
}

// Helper function to create variables for getting category translations
export function createGetCategoryTranslationsVariables(params: {
  channelId: number;
  locale: string;
}) {
  return {
    channelId: `bc/store/channel/${params.channelId}`,
    localeId: `bc/store/locale/${params.locale}`
  };
} 