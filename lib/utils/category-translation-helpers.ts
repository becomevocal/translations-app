// CSV record type for category translations
export interface CategoryTranslationRecord {
  categoryId: number;
  [key: string]: string | number; // Allow dynamic locale-based column names
}

// Helper function to get locale-specific field
export function getLocaleField(record: CategoryTranslationRecord, fieldPrefix: string, locale: string): string {
  const key = `${fieldPrefix}_${locale}`;
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

// Helper function to prepare category translation data for update
export function prepareCategoryTranslationData(record: CategoryTranslationRecord, locale: string) {
  return {
    categoryId: record.categoryId,
    fields: [
      {
        fieldName: "name",
        value: getLocaleField(record, 'name', locale),
      },
      {
        fieldName: "page_title",
        value: getLocaleField(record, 'page_title', locale),
      },
      {
        fieldName: "meta_description",
        value: getLocaleField(record, 'meta_description', locale),
      },
      {
        fieldName: "search_keywords",
        value: getLocaleField(record, 'search_keywords', locale),
      }
    ].filter(field => field.value !== '') // Remove empty fields
  };
}

// Helper function to generate CSV headers for category translations
export function generateCategoryCSVHeaders(defaultLocale: string, targetLocale: string): string[] {
  return [
    'categoryId',
    `name_${defaultLocale}`,
    `name_${targetLocale}`,
    `page_title_${defaultLocale}`,
    `page_title_${targetLocale}`,
    `meta_description_${defaultLocale}`,
    `meta_description_${targetLocale}`,
    `search_keywords_${defaultLocale}`,
    `search_keywords_${targetLocale}`,
  ];
}

// Helper function to format category data for CSV export
export function formatCategoryDataForCSV(
  categoryId: string, 
  fields: Array<{ fieldName: string; original: string; translation: string }>,
  defaultLocale: string,
  targetLocale: string
): CategoryTranslationRecord {
  // Extract the numeric ID from the format "bc/store/category/123"
  const numericCategoryId = parseInt(categoryId.split('/').pop() || '0', 10);
  
  // Create base record with category ID
  const record: CategoryTranslationRecord = {
    categoryId: numericCategoryId
  };
  
  // Add fields to the record
  fields.forEach(field => {
    record[`${field.fieldName}_${defaultLocale}`] = field.original || '';
    record[`${field.fieldName}_${targetLocale}`] = field.translation || '';
  });
  
  return record;
} 