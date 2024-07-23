import { AlertsManager, createAlertsManager, GlobalStyles } from "@bigcommerce/big-design";
import type { AppProps } from "next/app";

const MyApp = ({ Component, pageProps }: AppProps) => {  
  return (
    <>
      <GlobalStyles />
      <AlertsManager manager={alertsManager} />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;

export const alertsManager = createAlertsManager();