import Image from "next/image";
import { useTranslations } from 'next-intl';
import ActiveStateIcon from "@/icons/multi-lang-active-icon.svg";
import InactiveStateIcon from "@/icons/multi-lang-inactive-icon.svg";
import LoadingStateIcon from "@/icons/multi-lang-loading-icon.svg";

import { Button, Flex, FlexItem, Text } from "@bigcommerce/big-design";

export const TranslationsGetStarted = ({
  isActive = false,
  isLoading = true,
}: {
  isActive?: boolean;
  isLoading?: boolean;
}) => {
  const t = useTranslations('app.getStarted');

  const mainText = isLoading
    ? t('checking')
    : isActive
    ? t('active')
    : t('inactive');

  const secondaryText = isLoading
    ? t('checkingDescription')
    : isActive
    ? t('activeDescription')
    : t('inactiveDescription');

  const buttonText = isActive
    ? t('startWorkflow')
    : t('contactSupport');

  return (
    <Flex
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      flexGap="20px"
    >
      <FlexItem>
        <Image
          src={
            isLoading
              ? LoadingStateIcon
              : isActive
              ? ActiveStateIcon
              : InactiveStateIcon
          }
          alt={mainText}
        />
      </FlexItem>
      <FlexItem>
        <Text color="secondary70" marginBottom="none" bold>
          {mainText}
        </Text>
      </FlexItem>
      <FlexItem>
        <Text color="secondary70" marginBottom="none">
          {secondaryText}
        </Text>
      </FlexItem>
      <FlexItem>
        <Button isLoading={isLoading} variant="secondary">
          {buttonText}
        </Button>
      </FlexItem>
    </Flex>
  );
};
