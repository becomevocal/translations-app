import React from "react";
import { Flex, FlexItem, H3 } from "@bigcommerce/big-design";

interface SectionHeaderProps {
  icon: React.ComponentType;
  title: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon: Icon, title }) => {
  return (
    <H3 color="secondary70">
      <Flex
        flexDirection="row"
        flexGap="xSmall"
        alignItems="center"
        alignContent="center"
      >
        <FlexItem>
          <Icon />
        </FlexItem>
        <FlexItem paddingLeft="xxSmall" paddingTop="xxSmall">
          {title}
        </FlexItem>
      </Flex>
    </H3>
  );
};

export default SectionHeader; 