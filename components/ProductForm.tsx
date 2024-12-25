'use client'

import React, {
  useCallback,
  useMemo,
  useReducer,
  useEffect,
  ChangeEvent,
  FormEvent,
  MouseEvent,
} from "react";
import {
  Button,
  Box,
  Flex,
  HR,
  Input,
  Grid,
  GridItem,
  Select,
  Form as StyledForm,
  FlexItem,
  FormGroup,
  H4,
} from "@bigcommerce/big-design";
import { theme } from "@bigcommerce/big-design-theme";
import { defaultLocale, translatableProductFields } from "@/lib/constants";
import { ActionBar } from "bigcommerce-design-patterns";
import ErrorMessage from "./ErrorMessage";
import Loading, { LoadingScreen } from "./LoadingIndicator";
import Editor from "./TinyEditor";
import LocaleSelectorCallout from "./LocaleSelectorCallout";
import ActionBarPaddingBox from "./ActionBarPaddingBox";
import { addAlert } from "@/components/AlertsManager";
import { useStoreInfo } from "@/components/StoreInfoProvider";
import { TranslationsGetStarted } from "@/components/TranslationsGetStarted";

interface Channel {
  channel_id: number;
  channel_name: string;
  locales: {
    code: string;
    status: string;
    is_default: boolean;
    title: string;
  }[];
}

interface CustomField {
  id: string;
  name: string;
  value: string;
}

interface ProductFormProps {
  channels: Channel[];
  productId: number;
  context: string;
}

interface ProductFields {
  name: string;
  description: string;
  pageTitle: string;
  metaDescription: string;
}

interface ProductOptionValue {
  id: string;
  label: string;
}

interface ProductOption {
  id: string;
  displayName: string;
  values: ProductOptionValue[];
}

interface ProductModifierValue {
  id: string;
  label: string;
}

interface ProductModifier {
  id: string;
  displayName: string;
  values?: ProductModifierValue[];
  isRequired?: boolean;
  checkedByDefault?: boolean;
  fieldValue?: string;
  defaultValue?: string;
  defaultValueFloat?: number;
}

interface ProductData {
  name: string;
  description: string;
  pageTitle: string;
  metaDescription: string;
  localeData: {
    [key: string]: FormFields;
  };
  options?: {
    edges: Array<{
      node: ProductOption;
    }>;
  };
  modifiers?: {
    edges: Array<{
      node: ProductModifier;
    }>;
  };
  customFields?: {
    edges: Array<{
      node: CustomField;
    }>;
  };
}

interface FormOptionValue {
  [valueId: string]: string;
}

interface FormOption {
  displayName: string;
  values: FormOptionValue;
}

interface FormModifierValue {
  [valueId: string]: string;
}

interface FormModifier {
  displayName: string;
  values?: FormModifierValue;
  fieldValue?: string;
  defaultValue?: string;
}

interface FormFields extends ProductFields {
  options?: {
    [optionId: string]: FormOption;
  };
  modifiers?: {
    [modifierId: string]: FormModifier;
  };
  customFields?: {
    [fieldId: string]: {
      name: string;
      value: string;
    };
  };
}

interface State {
  currentChannel: number;
  currentLocale: string;
  productData: ProductData;
  form: FormFields;
  isProductInfoLoading: boolean;
  hasProductInfoLoadingError: boolean;
  isProductSaving: boolean;
  errors: Record<string, string>;
}

type Action =
  | { type: "SET_CHANNEL"; payload: number }
  | { type: "SET_LOCALE"; payload: string }
  | { type: "SET_PRODUCT_DATA"; payload: ProductData }
  | { type: "SET_FORM"; payload: FormFields }
  | { type: "SET_PRODUCT_INFO_LOADING"; payload: boolean }
  | { type: "SET_PRODUCT_INFO_LOADING_ERROR"; payload: boolean }
  | { type: "SET_PRODUCT_SAVING"; payload: boolean }
  | { type: "SET_ERRORS"; payload: Record<string, string> };

const initialState: State = {
  currentChannel: 1,
  currentLocale: "en-US",
  productData: {
    name: "",
    description: "",
    pageTitle: "",
    metaDescription: "",
    localeData: {},
  },
  form: { name: "", description: "", pageTitle: "", metaDescription: "" },
  isProductInfoLoading: true,
  hasProductInfoLoadingError: false,
  isProductSaving: false,
  errors: {},
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_CHANNEL":
      return { ...state, currentChannel: action.payload };
    case "SET_LOCALE":
      return { ...state, currentLocale: action.payload };
    case "SET_PRODUCT_DATA":
      return {
        ...state,
        productData: action.payload,
        isProductInfoLoading: false,
        isProductSaving: false,
        form: getFormObjectForLocale(action.payload, state.currentLocale),
      };
    case "SET_FORM":
      return { ...state, form: action.payload };
    case "SET_PRODUCT_INFO_LOADING":
      return { ...state, isProductInfoLoading: action.payload };
    case "SET_PRODUCT_INFO_LOADING_ERROR":
      return {
        ...state,
        hasProductInfoLoadingError: action.payload,
        isProductInfoLoading: false,
      };
    case "SET_PRODUCT_SAVING":
      return { ...state, isProductSaving: action.payload };
    default:
      return state;
  }
}

const getFormObjectForLocale = (
  productData: ProductData,
  locale: string
): FormFields => {
  const localeData = productData.localeData[locale] || {
    name: "",
    description: "",
    pageTitle: "",
    metaDescription: "",
    options: {},
    modifiers: {}
  };

  return {
    ...localeData,
    options: localeData.options || {},
    modifiers: localeData.modifiers || {}
  };
};

function ProductForm({ channels, productId, context }: ProductFormProps) {
  const { storeInformation, isLoading: isStoreInfoLoading } = useStoreInfo();
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    currentChannel: channels[0].channel_id,
    currentLocale: channels[0].locales[0].code,
  });
  const {
    currentChannel,
    currentLocale,
    productData,
    form,
    isProductInfoLoading,
    hasProductInfoLoadingError,
    isProductSaving,
    errors,
  } = state;

  const fetchProductData = useCallback(async () => {
    dispatch({ type: "SET_PRODUCT_INFO_LOADING", payload: true });
    try {
      const res = await fetch(
        `/api/product/${productId}?context=${context}&channel_id=${currentChannel}`
      );
      const data: ProductData = await res.json();
      dispatch({ type: "SET_PRODUCT_DATA", payload: data });
    } catch (error) {
      dispatch({ type: "SET_PRODUCT_INFO_LOADING_ERROR", payload: true });
    }
  }, [productId, currentChannel, context]);

  useEffect(() => {
    if (productId && currentChannel) {
      fetchProductData();
    }
  }, [fetchProductData, productId, currentChannel]);

  const handleSubmit = useCallback(
    async (
      event: FormEvent<HTMLFormElement> | MouseEvent<HTMLButtonElement>
    ) => {
      event.preventDefault();

      if (Object.keys(errors).length > 0) return;

      try {
        dispatch({ type: "SET_PRODUCT_SAVING", payload: true });
        const res = await fetch(
          `/api/product/${productId}?context=${context}&channel_id=${currentChannel}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, locale: currentLocale }),
          }
        );
        const updatedProductLocaleData: FormFields = await res.json();
        
        dispatch({
          type: "SET_PRODUCT_DATA",
          payload: {
            ...productData,
            localeData: {
              ...productData.localeData,
              [currentLocale]: updatedProductLocaleData,
            },
          },
        });
        addAlert({
          type: "success",
          header: "Update succeeded",
          autoDismiss: true,
          messages: [{ text: "Product translations have been saved." }],
        });
      } catch (error) {
        console.error("Error updating the product: ", error);
        addAlert({
          type: "error",
          header: "Update failed",
          autoDismiss: true,
          messages: [{ text: "Error updating the product translations." }],
        });
        dispatch({ type: "SET_PRODUCT_SAVING", payload: false });
      }
    },
    [currentChannel, currentLocale, form, errors, productId, productData, context]
  );

  const handleLocaleChange = useCallback(
    (selectedLocale: string) => {
      let newFormObject = getFormObjectForLocale(productData, selectedLocale);
      dispatch({ type: "SET_FORM", payload: newFormObject });
      dispatch({ type: "SET_LOCALE", payload: selectedLocale });
    },
    [productData]
  );

  const handleChannelChange = useCallback(
    (selectedChannelId: number) => {
      const selectedChannel = channels.find(
        (channel) => channel.channel_id === selectedChannelId
      );
      if (selectedChannel) {
        dispatch({ type: "SET_CHANNEL", payload: selectedChannelId });
        dispatch({
          type: "SET_LOCALE",
          payload:
            selectedChannel.locales?.[1]?.code ||
            selectedChannel.locales[0].code,
        });
      }
    },
    [channels]
  );

  const handleEditorChange = useCallback(
    (content: string, fieldName: keyof FormFields) => {
      dispatch({
        type: "SET_FORM",
        payload: { ...form, [fieldName]: content },
      });
    },
    [form]
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      
      if (name.startsWith('customField_') || name.startsWith('customFieldName_')) {
        const [_, fieldId] = name.split('_');
        const newForm = { ...form };
        
        if (!newForm.customFields) {
          newForm.customFields = {};
        }

        if (!newForm.customFields[fieldId]) {
          newForm.customFields[fieldId] = { name: '', value: '' };
        }
        
        if (name.startsWith('customFieldName_')) {
          newForm.customFields[fieldId].name = value;
        } else {
          newForm.customFields[fieldId].value = value;
        }

        dispatch({ type: "SET_FORM", payload: newForm });
      } else if (name.startsWith('option_') || name.startsWith('optionValue_')) {
        const [type, id] = name.split('_');
        const newForm = { ...form };
        
        if (!newForm.options) {
          newForm.options = {};
        }

        if (type === 'option') {
          if (!newForm.options[id]) {
            newForm.options[id] = { displayName: '', values: {} };
          }
          newForm.options[id].displayName = value;
        } else if (type === 'optionValue') {
          const [optionId, valueId] = id.split(':');
          if (!newForm.options[optionId]) {
            newForm.options[optionId] = { displayName: '', values: {} };
          }
          newForm.options[optionId].values[valueId] = value;
        }

        dispatch({ type: "SET_FORM", payload: newForm });
      } else if (name.startsWith('modifier_') || name.startsWith('value_') || name.startsWith('field_')) {
        const [type, id] = name.split('_');
        const newForm = { ...form };
        
        if (!newForm.modifiers) {
          newForm.modifiers = {};
        }

        if (type === 'modifier') {
          if (!newForm.modifiers[id]) {
            newForm.modifiers[id] = { displayName: '', values: {} };
          }
          newForm.modifiers[id].displayName = value;
        } else if (type === 'value') {
          const [modifierId, valueId] = id.split(':');
          if (!newForm.modifiers[modifierId]) {
            newForm.modifiers[modifierId] = { displayName: '', values: {} };
          }
          if (!newForm.modifiers[modifierId].values) {
            newForm.modifiers[modifierId].values = {};
          }
          newForm.modifiers[modifierId].values[valueId] = value;
        } else if (type === 'field') {
          if (!newForm.modifiers[id]) {
            newForm.modifiers[id] = { displayName: '', fieldValue: '' };
          }
          newForm.modifiers[id].fieldValue = value;
        }

        dispatch({ type: "SET_FORM", payload: newForm });
      } else {
        dispatch({ type: "SET_FORM", payload: { ...form, [name]: value } });
      }
    },
    [form]
  );

  const channelOptions = useMemo(
    () =>
      channels.map((channel) => ({
        value: channel.channel_id,
        content: channel.channel_name,
      })),
    [channels]
  );

  const localeOptions = useMemo(() => {
    const selectedChannel = channels.find(
      (channel) => channel.channel_id === currentChannel
    );
    return selectedChannel
      ? selectedChannel.locales.map((locale) => ({
          value: locale.code,
          content: `${locale.title} ${
            locale.code === defaultLocale ? "(Default)" : ""
          }`,
        }))
      : [];
  }, [channels, currentChannel]);

  const ActionBarButtons = useMemo(
    () => (
      <Button
        mobileWidth="auto"
        variant="primary"
        onClick={handleSubmit}
        disabled={isProductSaving}
        isLoading={isProductSaving}
      >
        Save
      </Button>
    ),
    [handleSubmit, isProductSaving]
  );

  if (isStoreInfoLoading) return <LoadingScreen />;

  if (!storeInformation.multi_language_enabled) {
    return <TranslationsGetStarted isActive={false} isLoading={false} />;
  }

  if (hasProductInfoLoadingError) return <ErrorMessage />;

  if (isProductInfoLoading) return <LoadingScreen />;

  return (
    <Loading isLoading={isProductInfoLoading}>
      <ActionBarPaddingBox>
        <Box marginBottom="xxLarge">
          <Flex flexDirection="column" flexGap={theme.spacing.xLarge}>
            <FlexItem flexGrow={0}>
              <Box paddingBottom="small">
                <Flex flexDirection="row" flexGap="0.5rem">
                  <FlexItem flexGrow={1} paddingBottom="medium">
                    <Select
                      name="lang"
                      options={channelOptions}
                      placeholder="Select Channel"
                      required
                      value={currentChannel}
                      onOptionChange={handleChannelChange}
                    />
                  </FlexItem>
                  <FlexItem flexGrow={1} paddingBottom="medium">
                    <Select
                      name="lang"
                      options={localeOptions}
                      placeholder="Select Language"
                      required
                      value={currentLocale}
                      onOptionChange={handleLocaleChange}
                    />
                  </FlexItem>
                </Flex>
              </Box>
              {currentLocale === defaultLocale && <LocaleSelectorCallout />}
            </FlexItem>
          </Flex>

          <HR color="secondary30" />
        </Box>

        <StyledForm fullWidth={true} onSubmit={handleSubmit}>
          {translatableProductFields.map((field) => (
            <Box key={`${field.key}_${currentLocale}`}>
              {field.type === "textarea" && (
                <Grid
                  gridColumns={{
                    mobile: "repeat(1, 1fr)",
                    tablet: "repeat(2, 1fr)",
                  }}
                  paddingBottom="medium"
                >
                  <GridItem>
                    <Editor
                      label={`${field.label} (${defaultLocale})`}
                      initialValue={
                        String(productData[field.key as keyof FormFields] || '')
                      }
                      isDisabled={true}
                    />
                  </GridItem>

                  {currentLocale !== defaultLocale && (
                    <GridItem>
                      <Editor
                        label={`${field.label} (${currentLocale})`}
                        initialValue={String(form[field.key as keyof FormFields] || '')}
                        onChange={(content: string) =>
                          handleEditorChange(
                            content,
                            field.key as keyof FormFields
                          )
                        }
                      />
                    </GridItem>
                  )}
                </Grid>
              )}
              {field.type === "input" && (
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
                        label={`${field.label} (${defaultLocale})`}
                        name={`defaultLocale_${field.key}`}
                        defaultValue={
                          String(productData[field.key as keyof FormFields] || '')
                        }
                        readOnly={true}
                        required={field.required}
                        disabled={true}
                      />
                    </FormGroup>
                  </GridItem>

                  {currentLocale !== defaultLocale && (
                    <GridItem>
                      <FormGroup>
                        <Input
                          label={`${field.label} (${currentLocale})`}
                          name={field.key}
                          value={String(form[field.key as keyof FormFields] ?? '')}
                          onChange={handleChange}
                          required={field.required}
                          minLength={4}
                        />
                      </FormGroup>
                    </GridItem>
                  )}
                </Grid>
              )}
              {field.type === "optionsList" && productData?.options?.edges && productData?.options?.edges.length > 0 && (
                <Box>
                  <H4>Options</H4>
                  <HR/>
                  {productData.options.edges.map((option) => (
                    <Box key={option.node.id} marginBottom="medium">
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
                                value={form.options?.[option.node.id]?.displayName || ''}
                                onChange={handleChange}
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
                          paddingLeft="medium"
                        >
                          <GridItem>
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
                            <GridItem>
                              <FormGroup>
                                <Input
                                  label={`${value.label} (${currentLocale})`}
                                  name={`optionValue_${option.node.id}:${value.id}`}
                                  value={form.options?.[option.node.id]?.values?.[value.id] || ''}
                                  onChange={handleChange}
                                />
                              </FormGroup>
                            </GridItem>
                          )}
                        </Grid>
                      ))}
                    </Box>
                  ))}
                </Box>
              )}
              {field.type === "modifiersList" && productData?.modifiers?.edges && productData?.modifiers?.edges.length > 0 && (
                <Box>
                  <H4>Modifiers</H4>
                  <HR/>
                  {productData.modifiers.edges.map((modifier) => (
                    <Box key={modifier.node.id} marginBottom="medium">
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
                                value={form.modifiers?.[modifier.node.id]?.displayName || ''}
                                onChange={handleChange}
                              />
                            </FormGroup>
                          </GridItem>
                        )}
                      </Grid>

                      {modifier.node.values && modifier.node.values.map((value) => (
                        <Grid
                          key={value.id}
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
                                label={`${value.label} (${defaultLocale})`}
                                name={`defaultLocale_value_${value.id}`}
                                defaultValue={value.label}
                                readOnly={true}
                                disabled={true}
                              />
                            </FormGroup>
                          </GridItem>

                          {currentLocale !== defaultLocale && (
                            <GridItem>
                              <FormGroup>
                                <Input
                                  label={`${value.label} (${currentLocale})`}
                                  name={`value_${modifier.node.id}:${value.id}`}
                                  value={form.modifiers?.[modifier.node.id]?.values?.[value.id] || ''}
                                  onChange={handleChange}
                                />
                              </FormGroup>
                            </GridItem>
                          )}
                        </Grid>
                      ))}

                      {(modifier.node.fieldValue !== undefined || modifier.node.defaultValue !== undefined) && (
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
                                name={`defaultLocale_field_${modifier.node.id}`}
                                defaultValue={modifier.node.fieldValue || modifier.node.defaultValue}
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
                                  name={`field_${modifier.node.id}`}
                                  value={form.modifiers?.[modifier.node.id]?.fieldValue || ''}
                                  onChange={handleChange}
                                />
                              </FormGroup>
                            </GridItem>
                          )}
                        </Grid>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
              {field.type === "customFieldsList" && productData?.customFields?.edges && productData?.customFields?.edges.length > 0 && (
                <Box>
                  <H4>Custom Fields</H4>
                  <HR/>
                  {productData.customFields.edges.map((field) => (
                    <Box key={field.node.id} marginBottom="medium">
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
                                value={form.customFields?.[field.node.id]?.name || ''}
                                onChange={handleChange}
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
                                value={form.customFields?.[field.node.id]?.value || ''}
                                onChange={handleChange}
                              />
                            </FormGroup>
                          </GridItem>
                        )}
                      </Grid>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ))}

          {currentLocale !== defaultLocale && (
            <ActionBar>{ActionBarButtons}</ActionBar>
          )}
        </StyledForm>
      </ActionBarPaddingBox>
    </Loading>
  );
}

export default React.memo(ProductForm);
