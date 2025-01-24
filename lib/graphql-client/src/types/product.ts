export interface ProductLocaleQueryOptions {
  pid: number;
  channelId: number;
  locale: string;
  availableLocales: Array<{ code: string }>;
  defaultLocale: string;
}

export interface ProductOptionValue {
  valueId: string;
  label: string;
}

export interface ProductModifierValue {
  valueId: string;
  label: string;
}

export interface ProductCustomField {
  name: string;
  value: string;
}

export interface ProductModifierBase {
  displayName?: string;
  __typename?: string;
}

export interface ProductModifierWithValues extends ProductModifierBase {
  values?: ProductModifierValue[];
  removeValues?: string[];
}

export interface ProductCheckboxModifier extends ProductModifierBase {
  fieldValue?: string;
}

export interface ProductTextFieldModifier extends ProductModifierBase {
  defaultValue?: string;
}

export interface ProductNumberFieldModifier extends ProductModifierBase {
  defaultValueFloat?: number;
}

export type ProductModifier = 
  | (ProductModifierWithValues & { __typename?: 'DropdownProductModifier' | 'RadioButtonsProductModifier' | 'RectangleListProductModifier' | 'SwatchProductModifier' | 'PickListProductModifier' })
  | (ProductCheckboxModifier & { __typename?: 'CheckboxProductModifier' })
  | (ProductTextFieldModifier & { __typename?: 'TextFieldProductModifier' | 'MultilineTextFieldProductModifier' })
  | (ProductNumberFieldModifier & { __typename?: 'NumbersOnlyTextFieldProductModifier' })
  | (ProductModifierBase & { __typename?: 'FileUploadProductModifier' | 'DateFieldProductModifier' });

export interface ProductLocaleUpdateOptions {
  locale: string;
  channelId: string | number;
  productId: string | number;
  productData: {
    // Basic product information
    name?: string;
    description?: string;
    pageTitle?: string;
    metaDescription?: string;
    warranty?: string;
    availabilityDescription?: string;
    searchKeywords?: string;
    preOrderMessage?: string;

    // Options
    options?: {
      [optionId: string]: {
        displayName?: string;
        values?: ProductOptionValue[];
        removeValues?: string[];
      };
    };

    // Modifiers
    modifiers?: {
      [modifierId: string]: ProductModifier;
    };

    // Custom fields
    customFields?: {
      [customFieldId: string]: ProductCustomField;
    };

    // Removal operations
    remove?: {
      options?: string[];
      modifiers?: string[];
      customFields?: string[];
    };
  }
} 