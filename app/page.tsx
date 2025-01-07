"use client";

import { Flex, FlexItem, Panel } from "@bigcommerce/big-design";
import { useTranslations } from 'next-intl';
import { useStoreInfo } from "@/components/store-info-provider";
import ErrorMessage from "@/components/error-message";
import { Header, Page } from "@bigcommerce/big-design-patterns";
import { TranslationsGetStarted } from "@/components/translations-get-started";
import { ResourceGroup } from "@/components/resource-group";

export default function Home() {
  const t = useTranslations('app');
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
            title={t('home.welcome')}
            description={t('home.description')}
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
