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
} from "@bigcommerce/big-design";
import { theme } from "@bigcommerce/big-design-theme";
import { alertsManager } from "@/pages/_app";
import { useRouter } from "next/router";
import { defaultLocale, translatableProductFields } from "@/lib/constants";
import { ActionBar } from "bigcommerce-design-patterns";
import ErrorMessage from "./ErrorMessage";
import Loading from "./LoadingIndicator";
import Editor from "./TinyEditor";
import LocaleSelectorCallout from "./LocaleSelectorCallout";
import ActionBarPaddingBox from "./ActionBarPaddingBox";

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

interface ProductFormProps {
  channels: Channel[];
}

interface ProductFields {
  name: string;
  description: string;
  pageTitle: string;
  metaDescription: string;
}

interface ProductData extends ProductFields {
  localeData: {
    [key: string]: ProductFields;
  };
}

interface State {
  currentChannel: number;
  currentLocale: string;
  productData: ProductData;
  form: ProductFields;
  isProductInfoLoading: boolean;
  hasProductInfoLoadingError: boolean;
  isProductSaving: boolean;
  errors: Record<string, string>;
}

type Action =
  | { type: "SET_CHANNEL"; payload: number }
  | { type: "SET_LOCALE"; payload: string }
  | { type: "SET_PRODUCT_DATA"; payload: ProductData }
  | { type: "SET_FORM"; payload: ProductFields }
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
    case "SET_ERRORS":
      return { ...state, errors: action.payload };
    default:
      return state;
  }
}

const getFormObjectForLocale = (
  productData: ProductData,
  locale: string
): ProductFields => {
  return (
    productData.localeData[locale] || {
      name: "",
      description: "",
      pageTitle: "",
      metaDescription: "",
    }
  );
};

const FormErrors: Record<string, string> = {}; // Define this based on your validation rules

function ProductForm({ channels }: ProductFormProps) {
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

  const router = useRouter();
  const pid = Number(router.query?.pid);

  const fetchProductData = useCallback(async () => {
    dispatch({ type: "SET_PRODUCT_INFO_LOADING", payload: true });
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const context = urlParams.get("context");
      const res = await fetch(
        `/api/product/${pid}?context=${context}&channel_id=${currentChannel}`
      );
      const data: ProductData = await res.json();
      dispatch({ type: "SET_PRODUCT_DATA", payload: data });
    } catch (error) {
      dispatch({ type: "SET_PRODUCT_INFO_LOADING_ERROR", payload: true });
    }
  }, [pid, currentChannel]);

  useEffect(() => {
    if (pid && currentChannel) {
      fetchProductData();
    }
  }, [fetchProductData, pid, currentChannel]);

  const handleSubmit = useCallback(
    async (
      event: FormEvent<HTMLFormElement> | MouseEvent<HTMLButtonElement>
    ) => {
      event.preventDefault();

      if (Object.keys(errors).length > 0) return;

      try {
        dispatch({ type: "SET_PRODUCT_SAVING", payload: true });
        const urlParams = new URLSearchParams(window.location.search);
        const context = urlParams.get("context");
        const res = await fetch(
          `/api/product/${pid}?context=${context}&channel_id=${currentChannel}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, locale: currentLocale }),
          }
        );
        const updatedProductLocaleData: ProductFields = await res.json();
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
        alertsManager.add({
          autoDismiss: true,
          messages: [{ text: "Product translations have been saved." }],
          type: "success",
        });
      } catch (error) {
        console.error("Error updating the product: ", error);
        alertsManager.add({
          autoDismiss: true,
          messages: [{ text: "Error updating the product translations." }],
          type: "error",
        });
        dispatch({ type: "SET_PRODUCT_SAVING", payload: false });
      }
    },
    [currentChannel, currentLocale, form, errors, pid, productData]
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
        // Select second locale, if available, when switching channels, since the default locale can't be edited
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
    (content: string, fieldName: keyof ProductFields) => {
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
      dispatch({ type: "SET_FORM", payload: { ...form, [name]: value } });

      if (!value && FormErrors[name]) {
        dispatch({
          type: "SET_ERRORS",
          payload: { ...errors, [name]: FormErrors[name] },
        });
      } else {
        const { [name]: _, ...newErrors } = errors;
        dispatch({ type: "SET_ERRORS", payload: newErrors });
      }
    },
    [form, errors]
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

  if (hasProductInfoLoadingError) return <ErrorMessage />;

  return (
    <Loading isLoading={isProductInfoLoading}>
      <ActionBarPaddingBox>
        {/* Channel and Locale selectors */}
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

        {/* Product fields */}
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
                        productData[field.key as keyof ProductFields]
                      }
                      isDisabled={true}
                    />
                  </GridItem>

                  {currentLocale !== defaultLocale && (
                    <GridItem>
                      <Editor
                        label={`${field.label} (${currentLocale})`}
                        initialValue={form[field.key as keyof ProductFields]}
                        onChange={(content: string) =>
                          handleEditorChange(
                            content,
                            field.key as keyof ProductFields
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
                          productData[field.key as keyof ProductFields]
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
                          value={form[field.key as keyof ProductFields]}
                          onChange={handleChange}
                          required={field.required}
                        />
                      </FormGroup>
                    </GridItem>
                  )}
                </Grid>
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
