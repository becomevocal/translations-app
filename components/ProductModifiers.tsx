import React from "react";
import { Box, Grid, GridItem, FormGroup, Input, Textarea } from "@bigcommerce/big-design";
import { ReceiptIcon } from "@bigcommerce/big-design-icons";
import SectionHeader from "./SectionHeader";

interface ProductModifierValue {
  id: string;
  label: string;
}

interface ProductModifier {
  __typename: string;
  id: string;
  displayName: string;
  values?: ProductModifierValue[];
  isRequired?: boolean;
  checkedByDefault?: boolean;
  fieldValue?: string;
  defaultValue?: string;
  defaultValueFloat?: string;
}

interface FormModifierValue {
  [valueId: string]: string;
}

interface FormModifier {
  displayName: string;
  values?: FormModifierValue;
  fieldValue?: string;
  defaultValue?: string;
  defaultValueFloat?: string;
}

interface ProductModifiersProps {
  modifiers: Array<{
    node: ProductModifier;
  }>;
  formModifiers: {
    [modifierId: string]: FormModifier;
  };
  defaultLocale: string;
  currentLocale: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const ProductModifiers: React.FC<ProductModifiersProps> = ({
  modifiers,
  formModifiers,
  defaultLocale,
  currentLocale,
  onChange,
}) => {
  if (!modifiers || modifiers.length === 0) return null;

  return (
    <Box paddingBottom="xSmall">
      <SectionHeader icon={ReceiptIcon} title="Modifiers" />
      {modifiers.map((modifier) => (
        <Box
          key={modifier.node.id}
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
                  label={`${modifier.node.displayName} (${defaultLocale})`}
                  name={`defaultLocale_modifier_${modifier.node.id}`}
                  defaultValue={modifier.node.displayName}
                  readOnly={true}
                  disabled={true}
                />
              </FormGroup>
            </GridItem>

            {currentLocale !== defaultLocale && (
              <GridItem>
                <FormGroup>
                  <Input
                    label={`${modifier.node.displayName} (${currentLocale})`}
                    name={`modifier_${modifier.node.id}`}
                    value={formModifiers?.[modifier.node.id]?.displayName || ""}
                    onChange={onChange}
                  />
                </FormGroup>
              </GridItem>
            )}
          </Grid>

          {modifier.node.values?.map((value) => (
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
                    name={`defaultLocale_modifierValue_${value.id}`}
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
                      name={`modifierValue_${modifier.node.id}:${value.id}`}
                      value={formModifiers?.[modifier.node.id]?.values?.[value.id] || ""}
                      onChange={onChange}
                    />
                  </FormGroup>
                </GridItem>
              )}
            </Grid>
          ))}

          {modifier.node.fieldValue !== undefined && (
            <Grid
              gridColumns={{
                mobile: "repeat(1, 1fr)",
                tablet: "repeat(2, 1fr)",
              }}
              paddingBottom="small"
              paddingLeft="medium"
            >
              <GridItem>
                <FormGroup>
                  <Input
                    label={`Field Value (${defaultLocale})`}
                    name={`defaultLocale_modifierField_${modifier.node.id}`}
                    defaultValue={modifier.node.fieldValue}
                    readOnly={true}
                    disabled={true}
                  />
                </FormGroup>
              </GridItem>

              {currentLocale !== defaultLocale && (
                <GridItem>
                  <FormGroup>
                    <Input
                      label={`Field Value (${currentLocale})`}
                      name={`modifierField_${modifier.node.id}`}
                      value={formModifiers?.[modifier.node.id]?.fieldValue || ""}
                      onChange={onChange}
                    />
                  </FormGroup>
                </GridItem>
              )}
            </Grid>
          )}

          {modifier.node.defaultValue !== undefined && (
            <Grid
              gridColumns={{
                mobile: "repeat(1, 1fr)",
                tablet: "repeat(2, 1fr)",
              }}
              paddingBottom="small"
              paddingLeft="medium"
            >
              <GridItem>
                <FormGroup>
                  {modifier.node.__typename === "MultilineTextFieldProductModifier" ? (
                    <Textarea
                      label={`Default Value (${defaultLocale})`}
                      name={`defaultLocale_modifierDefaultValue_${modifier.node.id}`}
                      defaultValue={modifier.node.defaultValue}
                      readOnly={true}
                      disabled={true}
                      rows={3}
                    />
                  ) : (
                    <Input
                      label={`Default Value (${defaultLocale})`}
                      name={`defaultLocale_modifierDefaultValue_${modifier.node.id}`}
                      defaultValue={modifier.node.defaultValue}
                      readOnly={true}
                      disabled={true}
                    />
                  )}
                </FormGroup>
              </GridItem>

              {currentLocale !== defaultLocale && (
                <GridItem>
                  <FormGroup>
                    {modifier.node.__typename === "MultilineTextFieldProductModifier" ? (
                      <Textarea
                        label={`Default Value (${currentLocale})`}
                        name={`modifierDefaultValue_${modifier.node.id}`}
                        value={formModifiers?.[modifier.node.id]?.defaultValue || ""}
                        onChange={onChange}
                        rows={3}
                      />
                    ) : (
                      <Input
                        label={`Default Value (${currentLocale})`}
                        name={`modifierDefaultValue_${modifier.node.id}`}
                        value={formModifiers?.[modifier.node.id]?.defaultValue || ""}
                        onChange={onChange}
                      />
                    )}
                  </FormGroup>
                </GridItem>
              )}
            </Grid>
          )}

          {modifier.node.defaultValueFloat !== undefined && (
            <Grid
              gridColumns={{
                mobile: "repeat(1, 1fr)",
                tablet: "repeat(2, 1fr)",
              }}
              paddingBottom="small"
              paddingLeft="medium"
            >
              <GridItem>
                <FormGroup>
                  <Input
                    type="number"
                    label={`Default Value (${defaultLocale})`}
                    name={`defaultLocale_modifierDefaultValueFloat_${modifier.node.id}`}
                    defaultValue={modifier.node.defaultValueFloat}
                    readOnly={true}
                    disabled={true}
                  />
                </FormGroup>
              </GridItem>

              {currentLocale !== defaultLocale && (
                <GridItem>
                  <FormGroup>
                    <Input
                      type="number"
                      label={`Default Value (${currentLocale})`}
                      name={`modifierDefaultValueFloat_${modifier.node.id}`}
                      value={formModifiers?.[modifier.node.id]?.defaultValueFloat || ""}
                      onChange={onChange}
                    />
                  </FormGroup>
                </GridItem>
              )}
            </Grid>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default ProductModifiers; 