import React from "react";
import { Box, Grid, GridItem, FormGroup, Input } from "@bigcommerce/big-design";
import { ReceiptIcon } from "@bigcommerce/big-design-icons";
import SectionHeader from "./SectionHeader";

interface ProductOptionValue {
  id: string;
  label: string;
}

interface ProductOption {
  id: string;
  displayName: string;
  values: ProductOptionValue[];
}

interface FormOption {
  displayName: string;
  values: {
    [valueId: string]: string;
  };
}

interface ProductOptionsProps {
  options: Array<{
    node: ProductOption;
  }>;
  formOptions: {
    [optionId: string]: FormOption;
  };
  defaultLocale: string;
  currentLocale: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProductOptions: React.FC<ProductOptionsProps> = ({
  options,
  formOptions,
  defaultLocale,
  currentLocale,
  onChange,
}) => {
  if (!options || options.length === 0) return null;

  return (
    <Box paddingBottom="xSmall">
      <SectionHeader icon={ReceiptIcon} title="Options" />
      {options.map((option) => (
        <Box
          key={option.node.id}
          marginBottom="medium"
          borderLeft="box"
          paddingLeft="small"
        >
          <Grid
            gridColumns={{
              mobile: "repeat(1, 1fr)",
              tablet: "repeat(2, 1fr)",
            }}
            paddingBottom="small"
          >
            <GridItem>
              <FormGroup>
                <Input
                  label={`${option.node.displayName} (${defaultLocale})`}
                  name={`defaultLocale_option_${option.node.id}`}
                  defaultValue={option.node.displayName}
                  readOnly={true}
                  disabled={true}
                />
              </FormGroup>
            </GridItem>

            {currentLocale !== defaultLocale && (
              <GridItem>
                <FormGroup>
                  <Input
                    label={`${option.node.displayName} (${currentLocale})`}
                    name={`option_${option.node.id}`}
                    value={formOptions?.[option.node.id]?.displayName || ""}
                    onChange={onChange}
                  />
                </FormGroup>
              </GridItem>
            )}
          </Grid>

          {option.node.values.map((value) => (
            <Grid
              key={value.id}
              gridColumns={{
                mobile: "repeat(1, 1fr)",
                tablet: "repeat(2, 1fr)",
              }}
              paddingBottom="small"
            >
              <GridItem paddingLeft="large">
                <FormGroup>
                  <Input
                    label={`${value.label} (${defaultLocale})`}
                    name={`defaultLocale_optionValue_${value.id}`}
                    defaultValue={value.label}
                    readOnly={true}
                    disabled={true}
                  />
                </FormGroup>
              </GridItem>

              {currentLocale !== defaultLocale && (
                <GridItem paddingLeft="large">
                  <FormGroup>
                    <Input
                      label={`${value.label} (${currentLocale})`}
                      name={`optionValue_${option.node.id}:${value.id}`}
                      value={formOptions?.[option.node.id]?.values?.[value.id] || ""}
                      onChange={onChange}
                    />
                  </FormGroup>
                </GridItem>
              )}
            </Grid>
          ))}
        </Box>
      ))}
    </Box>
  );
};

export default ProductOptions; 