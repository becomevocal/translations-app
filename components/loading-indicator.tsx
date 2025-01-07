"use client";

import { Box, ProgressCircle } from "@bigcommerce/big-design";
import React, { CSSProperties } from "react";

interface LoadingProps {
  isLoading?: boolean;
  children?: React.ReactNode;
  fullScreen?: boolean;
}

const LoadingIndicator: React.FC<LoadingProps> = ({
  isLoading = true,
  children,
  fullScreen = false,
}) => {
  if (!isLoading) return <>{children}</>;

  const fullScreenStyles: CSSProperties = fullScreen
    ? {
        height: "100vh",
        position: "fixed" as const,
        top: 0,
        left: 0,
        background: "rgba(255, 255, 255, 0.8)",
        zIndex: 1000,
      }
    : {};

  const baseStyles: CSSProperties = {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    width: "100%",
  };

  return (
    <Box
      padding="xxxLarge"
      style={{
        ...baseStyles,
        ...fullScreenStyles,
      }}
    >
      <ProgressCircle size="medium" />
    </Box>
  );
};

export const LoadingScreen: React.FC<{ fullScreen?: boolean }> = () => (
  <LoadingIndicator fullScreen={true} />
);

export default LoadingIndicator;
