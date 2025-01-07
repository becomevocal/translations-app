export * from "./user";
export * from "./session";
export * from "./database";

export interface StoreInformation {
  multi_language_enabled: boolean;
  multi_storefront: boolean;
  language: string;
}

export interface QueryParams {
  [key: string]: string | string[] | undefined;
}

export interface ApiConfig {
  apiUrl?: string;
  loginUrl?: string;
}
