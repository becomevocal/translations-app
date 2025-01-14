"use client";

import Image from "next/image";
import { useTranslations } from 'next-intl';
import { Box, Flex, FlexItem, Text } from "@bigcommerce/big-design";
import ErrorIcon from "@/icons/error-icon.svg";

const ErrorMessage = () => {
  const t = useTranslations('app.common');
  
  return (
    <Box margin="small" border="box" padding="large">
    <Flex
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      flexGap="20px"
    >
      <FlexItem>
        <Image src={ErrorIcon} alt={t('error')} />
      </FlexItem>
      <FlexItem>
        <Text color="secondary70" marginBottom="none">
          {t('error')}
        </Text>
      </FlexItem>
    </Flex>
    </Box>
  );
}

export default ErrorMessage;
