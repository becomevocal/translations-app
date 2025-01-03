"use server";

import { Analytics } from '@vercel/analytics/next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

import Alerts from "@/components/AlertsManager";
import {
  BigDesignTheme,
  GlobalStyles,
} from "@/components/BigDesignClientComponents";
import StoreInfoProvider from "@/components/StoreInfoProvider";
import { StoreInformation } from "@/types";

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  const initialStoreInformation: StoreInformation = {
    multi_language_enabled: false,
    multi_storefront: false,
    language: "en",
  };

  return (
    <html lang={locale}>
      <BigDesignTheme>
        <GlobalStyles />
        <body>
          <NextIntlClientProvider messages={messages}>
            <Alerts />
            <StoreInfoProvider initialStoreInformation={initialStoreInformation}>
              {children}
            </StoreInfoProvider>
            <Analytics />
          </NextIntlClientProvider>
        </body>
      </BigDesignTheme>
    </html>
  );
}
