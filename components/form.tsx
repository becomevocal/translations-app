import { Button, Box, Flex, H1, HR, Input, Panel, Select, Form as StyledForm, Textarea, Text, FlexItem, FormGroup } from "@bigcommerce/big-design";
import { theme } from "@bigcommerce/big-design-theme";
import { useRouter } from "next/router";
import { ArrowBackIcon, ArrowUpwardIcon } from "@bigcommerce/big-design-icons";
import { ChangeEvent, FormEvent, useState } from "react";
import { FormData, StringKeyValue } from "@/types";
import { availableLocales, defaultLocale, translatableProductFields } from "@/lib/constants";
import { ActionBar, ContextSelector, Header, Page } from "bigcommerce-design-patterns";

interface FormProps {
  formData: FormData;
  onCancel(): void;
  onSubmit(form: FormData, selectedLocale: string): void;
  isSaving: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const FormErrors:FormErrors = {};

function ProductForm({ formData: productData, onCancel, onSubmit, isSaving }: FormProps) {
  const router = useRouter();
  const [currentLocale, setLocale] = useState<string>(availableLocales[1].code);
  const [currentChannel, setChannel] = useState<number>(1);

  const getMetafieldValue = (fieldName: string, locale: string) => {
    const filteredFields = productData.metafields.filter(
      (meta: any) => meta.namespace === locale && meta.key === fieldName
    );
    return filteredFields[0]?.value;
  };

  const getLocaleValue = (productData: any, fieldName: string, locale: string) => {
    return productData?.localeData?.[locale]?.[fieldName]
  };

  const getFormObjectForLocale = (productData: any, locale: string) => {
    const formObject = Object.fromEntries(translatableProductFields.map((field) => {
      return [ 
        field.key, 
        // getMetafieldValue(field.key, locale) || productData[field.key] || ''
        getLocaleValue(productData, field.key, locale)
      ];
    }));

    formObject.metafields = productData['metafields'];

    return formObject;
  }

  const defaultLocaleProductData = productData;
  const initialFormObject = getFormObjectForLocale(productData, currentLocale);

  const [form, setForm] = useState<FormData>(initialFormObject);

  const [errors, setErrors] = useState<StringKeyValue>({});

  const handleBackClick = () => router.push("/");

  const handleLocaleChange = (selectedLocale: any) => {
    let newFormObject = getFormObjectForLocale(productData, selectedLocale);

    setForm({
      ...form,
      ...newFormObject,
    });

    setLocale(selectedLocale);
  };

  const handleChannelChange = (selectedChannel: any) => {
    // let newFormObject = getFormObjectForLocale(productData, selectedLocale);

    // setForm({
    //   ...form,
    //   ...newFormObject,
    // });

    setChannel(selectedChannel);
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name: fieldName, value } = event?.target;

    form[fieldName] = value;

    setForm(form);

    // Add error if it exists in FormErrors and the input is empty, otherwise remove from errors
    !value && FormErrors[fieldName]
      ? setErrors((prevErrors) => ({
          ...prevErrors,
          [fieldName]: FormErrors[fieldName],
        }))
      : setErrors(({ [fieldName]: removed, ...prevErrors }) => ({
          ...prevErrors,
        }));
  };

  const handleSubmit = (event: FormEvent<EventTarget>) => {
    event.preventDefault();

    // If there are errors, do not submit the form
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) return;

    onSubmit(form, currentLocale);
  };

  const ActionBarButtons = (
    <>
      {/* <Button
        variant="secondary"
        onClick={handleCancel}
        disabled={isSaving}
        mobileWidth="auto"
      >
        Cancel
      </Button> */}
      <Button
        mobileWidth="auto"
        variant="primary"
        onClick={handleSubmit}
        disabled={isSaving}
        isLoading={isSaving}
      >
        Save
      </Button>
    </>
  );

  return (
    <Box marginBottom="xxxLarge">
    {/* <Page
          headerTitle={defaultLocaleProductData['name']}
          // headerBackButtonLabel="Back to items list"
          // onHeaderBackButtonClick={backToListingHandler}
          // pageDescription={<>Description of what's going to be added.</>}
          actionBar={ActionBarButtons}
        > */}
        
      <Box marginBottom="xxLarge">

      <Flex flexDirection="column" flexGap={theme.spacing.xLarge}>
        
        
          {/* <FlexItem flexGrow={1} alignSelf="flex-start">
            {defaultLocaleProductData['name'] && <H1>{defaultLocaleProductData['name']}</H1>}
          </FlexItem> */}
          <FlexItem flexGrow={0}>
            <Box paddingBottom="small">
              {/* <Select
                name="lang"
                options={[{name: 'Channel 1', id: 1}].map((channel) => ({
                  value: channel.id,
                  content: channel.name,
                }))}
                placeholder="Select Channel"
                required
                value={currentChannel}
                onOptionChange={handleChannelChange}
              /> */}
              <Select
                name="lang"
                options={availableLocales.map((locale) => ({
                  value: locale.code,
                  content: `${locale.label} ${locale.code === defaultLocale ? '(Default)': ''}`,
                }))}
                placeholder="Select Language"
                required
                value={currentLocale}
                onOptionChange={handleLocaleChange}
              />
            </Box>
            {currentLocale === defaultLocale &&
            <Box style={{ 
              margin: 'auto',
              position: 'fixed',
              textAlign: 'right',
              right: '1rem',
              width: '15rem',
              top: '4rem',
              backgroundColor: 'white',
              padding: '1rem',
              opacity: '0.9',
              zIndex:1000,
              }}>
              <ArrowUpwardIcon color="primary60" size="xLarge" />
              <Text color="primary60">Select a locale above to start editing translations for this product.</Text>
            </Box> 
          }
          </FlexItem>

        </Flex>
        
        <HR color="secondary30" />
      </Box>
    
      <StyledForm fullWidth={true} onSubmit={handleSubmit}>
        {/* <Panel header="test"> */}
          {translatableProductFields.map((field) =>
            <Box key={`${field.key}_${currentLocale}`}>
              {field.type === 'textarea' && 
                <Flex>
                  <FlexItem flexGrow={1} paddingBottom="medium">
                    <Box style={{maxWidth: '40rem'}}>
                    <FormGroup>
                      <Textarea
                        label={`${field.label} (${defaultLocale})`}
                        name={`defaultLocale_${field.key}`}
                        defaultValue={defaultLocaleProductData[field.key]}
                        readOnly={true}
                        rows={5}
                        required={field.required}
                      />
                      </FormGroup>
                    </Box>
                  </FlexItem>
                  
                  {currentLocale !== defaultLocale && 
                    <FlexItem flexGrow={1} paddingBottom="medium">
                      <Box paddingLeft={{ mobile: "none", tablet: "xLarge" }} style={{maxWidth: '40rem'}}>
                      <FormGroup>
                        <Textarea
                          label={`${field.label} (${currentLocale})`}
                          name={field.key}
                          value={form[field.key]}
                          onChange={handleChange}
                          required={field.required}
                          rows={5}
                        />
                        </FormGroup>
                      </Box>
                    </FlexItem>
                  }
                </Flex>
              }
              {field.type === 'input' && 
                <Flex>
                  <FlexItem flexGrow={1} paddingBottom="medium">
                    <Box style={{maxWidth: '40rem'}}>
                      <FormGroup>
                      <Input
                        label={`${field.label} (${defaultLocale})`}
                        name={`defaultLocale_${field.key}`}
                        defaultValue={defaultLocaleProductData[field.key]}
                        readOnly={true}
                        required={field.required}
                      />
                      </FormGroup>
                    </Box>
                  </FlexItem>

                  {currentLocale !== defaultLocale &&
                    <FlexItem flexGrow={1} paddingBottom="medium">
                      <Box paddingLeft={{ mobile: "none", tablet: "xLarge" }} style={{maxWidth: '40rem'}}>
                      <FormGroup>
                        <Input
                          label={`${field.label} (${currentLocale})`}
                          name={field.key}
                          value={form[field.key]}
                          onChange={handleChange}
                          required={field.required}
                        />
                        </FormGroup>
                      </Box>
                    </FlexItem>
                  }
                </Flex>
              }
            </Box>
          )}
          
          
        {/* </Panel> */}

        <ActionBar>
          {ActionBarButtons}
        </ActionBar>
      </StyledForm>
      {/* </Page> */}
    </Box>
  );
}

export default ProductForm;
