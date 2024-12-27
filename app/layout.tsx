"use server";

import { Analytics } from '@vercel/analytics/next';

import Alerts from "@/components/AlertsManager";
import {
  BigDesignTheme,
  GlobalStyles,
} from "@/components/BigDesignClientComponents";
import StoreInfoProvider from "@/components/StoreInfoProvider";
import { StoreInformation } from "@/types";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialStoreInformation: StoreInformation = {
    multi_language_enabled: false,
    multi_storefront: false,
  };

  return (
    <html lang="en">
      <BigDesignTheme>
        <GlobalStyles />
        <body>
          <Alerts />
          <StoreInfoProvider initialStoreInformation={initialStoreInformation}>
            {children}
          </StoreInfoProvider>
          <Analytics />
        </body>
      </BigDesignTheme>
    </html>
  );
}
