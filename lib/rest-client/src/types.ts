export interface RestClientConfig {
  accessToken?: string;
  storeHash?: string;
  apiUrl?: string;
  loginUrl?: string;
  maxRetries?: number;
  headers?: Record<string, string>;
}

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  retryCount?: number;
}

export interface StoreInformationResponse {
  id: string;
  domain: string;
  secure_url: string;
  status: string;
  name: string;
  first_name: string;
  last_name: string;
  address: string;
  country: string;
  phone: string;
  admin_email: string;
  order_email: string;
  timezone: {
    name: string;
    raw_offset: number;
    dst_offset: number;
    dst_correction: boolean;
    date_format: {
      display: string;
      export: string;
      extended_display: string;
    };
  };
  language: string;
  currency: string;
  currency_symbol: string;
  decimal_separator: string;
  thousands_separator: string;
  decimal_places: number;
  currency_symbol_location: string;
  weight_units: string;
  dimension_units: string;
  plan_name: string;
  logo: {
    url: string;
  };
  is_price_entered_with_tax: boolean;
  active_comparison_modules: any[];
  account_uuid: string;
  control_panel_base_url: string;
  country_code: string;
  favicon_url: string;
  dimension_decimal_places: number;
  dimension_decimal_token: string;
  dimension_thousands_token: string;
  plan_level: string;
  plan_is_trial: boolean;
  industry: string;
  store_id: number;
  default_channel_id: number;
  default_site_id: number;
  features: {
    stencil_enabled: boolean;
    sitewide_https_enabled: boolean;
    facebook_catalog_id: string;
    checkout_type: string;
    wishlists_enabled: boolean;
    graphql_storefront_api_enabled: boolean;
    shopper_consent_tracking_enabled: boolean;
    multi_storefront_enabled: boolean;
    multi_language_enabled: boolean;
    storefront_limits: {
      active: number;
      total_including_inactive: number;
    };
  };
} 