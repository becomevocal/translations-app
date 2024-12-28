import React from "react";
import { Box, Flex, FlexItem, Select } from "@bigcommerce/big-design";
import { theme } from "@bigcommerce/big-design-theme";
import LocaleSelectorCallout from "./LocaleSelectorCallout";
import { defaultLocale } from "@/lib/constants";

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

interface ChannelLocaleSelectorProps {
  channels: Channel[];
  currentChannel: number;
  currentLocale: string;
  onChannelChange: (channelId: number) => void;
  onLocaleChange: (locale: string) => void;
}

const ChannelLocaleSelector: React.FC<ChannelLocaleSelectorProps> = ({
  channels,
  currentChannel,
  currentLocale,
  onChannelChange,
  onLocaleChange,
}) => {
  const channelOptions = channels.map((channel) => ({
    value: channel.channel_id,
    content: channel.channel_name,
  }));

  const localeOptions = React.useMemo(() => {
    const selectedChannel = channels.find(
      (channel) => channel.channel_id === currentChannel
    );
    return selectedChannel
      ? selectedChannel.locales.map((locale) => ({
          value: locale.code,
          content: `${locale.title} ${
            locale.code === defaultLocale ? "(Default)" : ""
          }`,
        }))
      : [];
  }, [channels, currentChannel]);

  return (
    <FlexItem flexGrow={0}>
      <Box paddingBottom="small">
        <Flex flexDirection="row" flexGap="0.5rem">
          <FlexItem flexGrow={1} paddingBottom="medium">
            <Select
              name="lang"
              options={channelOptions}
              placeholder="Select Channel"
              required
              value={currentChannel}
              onOptionChange={onChannelChange}
            />
          </FlexItem>
          <FlexItem flexGrow={1} paddingBottom="medium">
            <Select
              name="lang"
              options={localeOptions}
              placeholder="Select Language"
              required
              value={currentLocale}
              onOptionChange={onLocaleChange}
            />
          </FlexItem>
        </Flex>
      </Box>
      {currentLocale === defaultLocale && <LocaleSelectorCallout />}
    </FlexItem>
  );
};

export default ChannelLocaleSelector; 