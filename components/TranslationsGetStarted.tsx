import Image from "next/image";
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
  const mainText = isLoading
    ? "Checking for multi-language functionality..."
    : isActive
    ? "Multi-language functionality is active!"
    : "Multi-language functionality is not available.";

  const secondaryText = isLoading
    ? "Please wait while we check your store's configuration."
    : isActive
    ? "Your store is ready to use multiple languages."
    : "Your current plan doesn't support multiple languages.";

    const buttonText = isActive
    ? "Start translation workflow"
    : "Contact support";

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
          alt={
            isLoading
              ? "Checking for multi-language functionality..."
              : isActive
              ? "Multi-lang functionality is active."
              : "Multi-lang functionality not available on this store."
          }
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
