import { Box, Text } from "@bigcommerce/big-design";
import { ArrowUpwardIcon } from "@bigcommerce/big-design-icons";
import React from "react";
import styled from "styled-components";

const StyledBox = styled(Box)`
  margin: auto;
  position: fixed;
  text-align: right;
  right: 1rem;
  width: 15rem;
  top: 4rem;
  background-color: white;
  padding: 1rem;
  opacity: 0.9;
  z-index: 1000;
`;

const LocaleSelectorCallout: React.FC = () => {
  return (
    <StyledBox>
      <ArrowUpwardIcon color="primary60" size="xLarge" />
      <Text color="primary60">
        Select a locale above to start editing translations for this product.
      </Text>
    </StyledBox>
  );
};

export default LocaleSelectorCallout;
