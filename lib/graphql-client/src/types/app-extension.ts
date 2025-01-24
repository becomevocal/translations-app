export type AppExtensionContext = 'LINK' | 'PANEL' | 'BUTTON' | 'FULL_PAGE';
export type AppExtensionModel = 'PRODUCTS' | 'CATEGORIES' | 'ORDERS' | 'CUSTOMERS' | 'PRODUCT_DESCRIPTION';

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
  context: AppExtensionContext | null;
  model: AppExtensionModel | null;
  url: string;
  label: AppExtensionLabel;
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