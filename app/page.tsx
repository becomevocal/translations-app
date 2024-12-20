"use client";

import { Flex, FlexItem, Panel } from "@bigcommerce/big-design";
import { useStoreInfo } from "@/components/StoreInfoProvider";
import ErrorMessage from "@/components/ErrorMessage";
import { Header, Page } from "@bigcommerce/big-design-patterns";
import { TranslationsGetStarted } from "@/components/TranslationsGetStarted";
import { ResourceGroup } from "@/components/ResourceGroup";

const gettext = (inputString: string) => {
  return inputString;
};

export default function Home() {
  const {
    storeInformation,
    isLoading: isStoreInformationLoading,
    hasError: hasStoreInformationLoadingError,
  } = useStoreInfo();

  if (hasStoreInformationLoadingError) return <ErrorMessage />;

  return (
    <Page
      background={{
        src: "https://storage.googleapis.com/bigcommerce-production-dev-center/images/dev-portal-bg-pattern.svg",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center top",
      }}
    >
      <Flex flexDirection="column" flexGap="1.5rem">
        <FlexItem>
          <Header
            title="Welcome to the Translation Center!"
            description="This is where you can learn about the management of multiple languages on your Catalyst storefront."
          />
        </FlexItem>
        <FlexItem>
          <Panel marginBottom="none">
            <TranslationsGetStarted
              isActive={storeInformation.multi_language_enabled}
              isLoading={isStoreInformationLoading}
            />
          </Panel>
        </FlexItem>
        <FlexItem>
          <ResourceGroup fullWidth={false} />
        </FlexItem>
      </Flex>
    </Page>
  );
}
