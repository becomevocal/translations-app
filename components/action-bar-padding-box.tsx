import { Box } from "@bigcommerce/big-design";
import React, { ReactNode } from "react";
import styled from "styled-components";

interface ActionBarPaddingBoxProps {
  children?: ReactNode;
}

const StyledBox = styled(Box)`
  margin-bottom: 4rem;
`;

const ActionBarPaddingBox: React.FC<ActionBarPaddingBoxProps> = ({
  children,
}) => {
  return <StyledBox>{children}</StyledBox>;
};

export default ActionBarPaddingBox;
