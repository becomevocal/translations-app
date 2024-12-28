import React from "react";
import { Box, Grid, GridItem, FormGroup, Input } from "@bigcommerce/big-design";
import { ReceiptIcon } from "@bigcommerce/big-design-icons";
import SectionHeader from "./SectionHeader";

interface CustomField {
  id: string;
  name: string;
  value: string;
}

interface FormCustomField {
  name: string;
  value: string;
}

interface CustomFieldsProps {
  customFields: Array<{
    node: CustomField;
  }>;
  formCustomFields: {
    [fieldId: string]: FormCustomField;
  };
  defaultLocale: string;
  currentLocale: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const CustomFields: React.FC<CustomFieldsProps> = ({
  customFields,
  formCustomFields,
  defaultLocale,
  currentLocale,
  onChange,
}) => {
  if (!customFields || customFields.length === 0) return null;

  return (
    <Box paddingBottom="xSmall">
      <SectionHeader icon={ReceiptIcon} title="Custom Fields" />
      {customFields.map((field) => (
        <Box
          key={field.node.id}
          marginBottom="medium"
          borderLeft="box"
          paddingLeft="small"
        >
          <Grid
            gridColumns={{
              mobile: "repeat(2, 1fr)",
              tablet: "repeat(2, 1fr)",
            }}
            paddingBottom="small"
          >
            <GridItem>
              <FormGroup>
                <Input
                  label={`Name (${defaultLocale})`}
                  name={`defaultLocale_customFieldName_${field.node.id}`}
                  defaultValue={field.node.name}
                  readOnly={true}
                  disabled={true}
                />
              </FormGroup>
            </GridItem>

            {currentLocale !== defaultLocale && (
              <GridItem>
                <FormGroup>
                  <Input
                    label={`Name (${currentLocale})`}
                    name={`customFieldName_${field.node.id}`}
                    value={formCustomFields?.[field.node.id]?.name || ""}
                    onChange={onChange}
                  />
                </FormGroup>
              </GridItem>
            )}

            <GridItem>
              <FormGroup>
                <Input
                  label={`Value (${defaultLocale})`}
                  name={`defaultLocale_customField_${field.node.id}`}
                  defaultValue={field.node.value}
                  readOnly={true}
                  disabled={true}
                />
              </FormGroup>
            </GridItem>

            {currentLocale !== defaultLocale && (
              <GridItem>
                <FormGroup>
                  <Input
                    label={`Value (${currentLocale})`}
                    name={`customField_${field.node.id}`}
                    value={formCustomFields?.[field.node.id]?.value || ""}
                    onChange={onChange}
                  />
                </FormGroup>
              </GridItem>
            )}
          </Grid>
        </Box>
      ))}
    </Box>
  );
};

export default CustomFields; 