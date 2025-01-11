export interface ProductLocaleQueryOptions {
  pid: string;
  channelId: string;
  availableLocales: Array<{ code: string }>;
  defaultLocale: string;
}

export interface ProductLocaleMutationOptions {
  pid: string;
  channelId: string;
  locale: string;
} 