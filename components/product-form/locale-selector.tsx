"use client";

import { useTranslations } from "next-intl";
import { Box, Flex, FlexItem, Select } from "@bigcommerce/big-design";
import LocaleSelectorCallout from "./locale-selector-callout";

interface Channel {
  channel_id: number;
  channel_name: string;
  locales: {
    code: string;
    status: string;
    is_default: boolean;
    title: string;
  }[];
}

interface Props {
  channels: Channel[];
  currentChannel: number;
  currentLocale: string;
  onChannelChange: (channelId: number) => void;
  onLocaleChange: (locale: string) => void;
}

const ChannelLocaleSelector = ({
  channels,
  currentChannel,
  currentLocale,
  onChannelChange,
  onLocaleChange,
}: Props) => {
  const t = useTranslations("app.products.form");
  const currentChannelData = channels.find(
    (channel) => channel.channel_id === currentChannel
  );

  return (
    <Flex flexDirection="row" flexGap="1.5rem">
      <FlexItem flexGrow={1}>
        <Box>
          <Select
            label={t("channelSelector.label")}
            placeholder={t("channelSelector.placeholder")}
            options={channels.map((channel) => ({
              value: channel.channel_id,
              content: channel.channel_name,
            }))}
            value={currentChannel}
            onOptionChange={onChannelChange}
          />
        </Box>
      </FlexItem>
      <FlexItem flexGrow={1}>
        <Box>
          <Select
            label={t("localeSelector.label")}
            placeholder={t("localeSelector.placeholder")}
            options={
              currentChannelData?.locales.map((locale) => ({
                value: locale.code,
                content: locale.title,
              })) || []
            }
            value={currentLocale}
            onOptionChange={onLocaleChange}
          />
        </Box>
        {currentChannelData?.locales.find(
          (locale) => locale.code === currentLocale && locale.is_default
        ) && <LocaleSelectorCallout />}
      </FlexItem>
    </Flex>
  );
};

export default ChannelLocaleSelector;
