/**
 * Helper functions to produce the correct input for product mutations
 */

/**
 * Identifies which basic information fields should be removed based on empty values
 */
export function getBasicInformationFieldsToRemove(data: any): string[] {
  const fieldsToRemove: string[] = [];
  if (!data.name || data.name.trim() === '') {
    fieldsToRemove.push('PRODUCT_NAME_FIELD');
  }
  if (!data.description || data.description.trim() === '') {
    fieldsToRemove.push('PRODUCT_DESCRIPTION_FIELD');
  }
  return fieldsToRemove;
}

/**
 * Identifies which SEO information fields should be removed based on empty values
 */
export function getSeoInformationFieldsToRemove(data: any): string[] {
  const fieldsToRemove: string[] = [];
  if (!data.pageTitle || data.pageTitle.trim() === '') {
    fieldsToRemove.push('PRODUCT_PAGE_TITLE_FIELD');
  }
  if (!data.metaDescription || data.metaDescription.trim() === '') {
    fieldsToRemove.push('PRODUCT_META_DESCRIPTION_FIELD');
  }
  return fieldsToRemove;
}

/**
 * Identifies which storefront details fields should be removed based on empty values
 */
export function getStorefrontDetailsFieldsToRemove(data: any): string[] {
  const fieldsToRemove: string[] = [];
  if (!data.warranty || data.warranty.trim() === '') {
    fieldsToRemove.push('PRODUCT_WARRANTY');
  }
  if (!data.availabilityDescription || data.availabilityDescription.trim() === '') {
    fieldsToRemove.push('PRODUCT_AVAILABILITY_DESCRIPTION_FIELD');
  }
  if (!data.searchKeywords || data.searchKeywords.trim() === '') {
    fieldsToRemove.push('PRODUCT_SEARCH_KEYWORDS');
  }
  return fieldsToRemove;
}

/**
 * Identifies which pre-order settings fields should be removed based on empty values
 */
export function getPreOrderSettingsFieldsToRemove(data: any): string[] {
  const fieldsToRemove: string[] = [];
  if (!data.preOrderMessage || data.preOrderMessage.trim() === '') {
    fieldsToRemove.push('PRODUCT_PRE_ORDER_MESSAGE');
  }
  return fieldsToRemove;
}

/**
 * Identifies which custom fields should be removed based on empty values
 */
export function getCustomFieldsToRemove(data: any): { customFieldId: string, fields: string[] }[] {
  if (!data.customFields) return [];

  return Object.entries(data.customFields).map(([fieldId, fieldDetails]: [string, any]) => {
    const fields: string[] = [];
    if (!fieldDetails.name || fieldDetails.name.trim() === '') {
      fields.push('NAME');
    }
    if (!fieldDetails.value || fieldDetails.value.trim() === '') {
      fields.push('VALUE');
    }
    return {
      customFieldId: fieldId,
      fields: fields
    };
  }).filter(item => item.fields.length > 0);
} 