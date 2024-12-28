import React from "react";
import { Grid, GridItem, FormGroup, Input, Textarea } from "@bigcommerce/big-design";
import Editor from "./TinyEditor";

interface TranslatableFieldProps {
  type: "input" | "textarea";
  label: string;
  name: string;
  defaultValue: string;
  currentValue: string;
  defaultLocale: string;
  currentLocale: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onEditorChange?: (content: string) => void;
  required?: boolean;
  minLength?: number;
}

const TranslatableField: React.FC<TranslatableFieldProps> = ({
  type,
  label,
  name,
  defaultValue,
  currentValue,
  defaultLocale,
  currentLocale,
  onChange,
  onEditorChange,
  required,
  minLength,
}) => {
  if (type === "textarea") {
    return (
      <Grid
        gridColumns={{
          mobile: "repeat(1, 1fr)",
          tablet: "repeat(2, 1fr)",
        }}
        paddingBottom="medium"
      >
        <GridItem>
          <Editor
            label={`${label} (${defaultLocale})`}
            initialValue={defaultValue}
            isDisabled={true}
          />
        </GridItem>

        {currentLocale !== defaultLocale && (
          <GridItem>
            <Editor
              label={`${label} (${currentLocale})`}
              initialValue={currentValue}
              onChange={onEditorChange}
            />
          </GridItem>
        )}
      </Grid>
    );
  }

  return (
    <Grid
      gridColumns={{
        mobile: "repeat(1, 1fr)",
        tablet: "repeat(2, 1fr)",
      }}
      paddingBottom="medium"
    >
      <GridItem>
        <FormGroup>
          <Input
            label={`${label} (${defaultLocale})`}
            name={`defaultLocale_${name}`}
            defaultValue={defaultValue}
            readOnly={true}
            required={required}
            disabled={true}
          />
        </FormGroup>
      </GridItem>

      {currentLocale !== defaultLocale && (
        <GridItem>
          <FormGroup>
            <Input
              label={`${label} (${currentLocale})`}
              name={name}
              value={currentValue}
              onChange={onChange}
              required={required}
              minLength={minLength}
            />
          </FormGroup>
        </GridItem>
      )}
    </Grid>
  );
};

export default TranslatableField; 