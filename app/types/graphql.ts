export interface Product {
  id: number;
  name: string;
  description: string;
}

export interface ProductLocaleData {
  name?: string;
  description?: string;
}

export interface ProductLocaleContext {
  channelId: string;
  locale: string;
}

export interface ProductLocaleQueryOptions {
  productId: string;
  localeContext: ProductLocaleContext;
}
