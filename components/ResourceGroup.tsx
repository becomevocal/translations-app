"use client";

import Image from 'next/image';
import BCDevLogo from "@/icons/bc-dev-logo.svg";
import BCLogo from "@/icons/bc-logo.svg";
import {
  Box,
  Flex,
  FlexItem,
  Grid,
  H4,
  Link,
  Panel,
  Text,
} from "@bigcommerce/big-design";

interface ResourceItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  links: { text: string; href: string }[];
}

const resources = [
  {
    icon: <Image src={BCDevLogo} alt="BigCommerce" />,
    title: "Translation Guidelines",
    description: "Learn best practices for translating your store's catalog content",
    links: [
      {
        text: "Translation Best Practices",
        href: "https://developer.bigcommerce.com/docs/storefront-translation",
      },
      {
        text: "Managing Multi-Language Content",
        href: "https://developer.bigcommerce.com/docs/multi-language",
      },
    ],
  },
  {
    icon: <Image src={BCLogo} alt="BigCommerce" />,
    title: "Translation Support",
    description: "Get help with managing translations and localization settings",
    links: [
      {
        text: "Translation FAQ",
        href: "https://support.bigcommerce.com/s/article/translation-guide",
      },
      {
        text: "Localization Settings",
        href: "https://support.bigcommerce.com/s/article/localization-settings",
      },
    ],
  },
];

const ResourceItem = ({ title, description, links }: ResourceItemProps) => {
  return (
    <Box
      border="box"
      padding="xLarge"
      borderRadius="normal"
      style={{ height: "100%" }}
    >
      <Flex flexDirection="column" flexGap="0.5rem" marginBottom="large">
        <FlexItem>
          <H4 margin="none">{title}</H4>
        </FlexItem>
        <FlexItem>
          <Text marginBottom="medium" color="secondary60">
            {description}
          </Text>
        </FlexItem>
      </Flex>

      <Flex flexDirection="row" flexGap="1.5rem" flexWrap="wrap">
        {links.map((link, index) => (
          <FlexItem key={index}>
            <Link external href={link.href} target="_blank">
              {link.text}
            </Link>
          </FlexItem>
        ))}
      </Flex>
    </Box>
  );
};

export const ResourceGroup = ({
  fullWidth = false,
}: {
  fullWidth?: boolean;
}) => {
  return (
    <Panel header="Resources">
      <Grid
        gridColumns={{
          mobile: "1fr",
          desktop: fullWidth ? "repeat(2, 1fr)" : "1fr",
        }}
      >
        {resources.map((resource, index) => (
          <div key={`resource_item-${index}`} className="last:col-span-full">
            <ResourceItem {...resource} />
          </div>
        ))}
      </Grid>
    </Panel>
  );
};
