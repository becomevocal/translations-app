import {
  Button,
  Box,
  Flex,
  H1,
  HR,
  Input,
  Panel,
  Select,
  Form as StyledForm,
  Textarea,
  Text,
  FlexItem,
  FormGroup,
} from "@bigcommerce/big-design";
import { theme } from "@bigcommerce/big-design-theme";
import { alertsManager } from "@/pages/_app";
import { useRouter } from "next/router";
import { ArrowBackIcon, ArrowUpwardIcon } from "@bigcommerce/big-design-icons";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { FormData, StringKeyValue } from "@/types";
import {
  availableLocales,
  defaultLocale,
  translatableProductFields,
} from "@/lib/constants";
import {
  ActionBar,
  ContextSelector,
  Header,
  Page,
} from "bigcommerce-design-patterns";
import ErrorMessage from "./error";
import Loading from "./loading";

interface FormProps {
  channels: { id: number; name: string }[];
}

interface FormErrors {
  [key: string]: string;
}

const FormErrors: FormErrors = {};

function ProductForm({ channels }: FormProps) {
  const router = useRouter();
  const pid = Number(router.query?.pid);
  const [currentLocale, setLocale] = useState<string>(availableLocales[1].code);
  const [currentChannel, setChannel] = useState<number>(1);
  const [productData, setProductData] = useState<any>({});
  const [isProductInfoLoading, setProductInfoLoading] = useState(true);
  const [hasProductInfoLoadingError, setProductInfoLoadingError] = useState(false);
  const [isProductSaving, setProductSaving] = useState(false);

  useEffect(() => {
    const fetchProductData = async () => {
      setProductInfoLoading(true);
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const context = urlParams.get('context');
        const res = await fetch(`/api/product/${pid}?context=${context}&channel_id=${currentChannel}`);
        const data = await res.json() as any;
        setProductData(data);
        setForm(getFormObjectForLocale(data, currentLocale));
      } catch (error) {
        setProductInfoLoadingError(true);
      } finally {
        setProductInfoLoading(false);
      }
    };

    if (pid && currentChannel) {
      fetchProductData();
    }
  }, [pid, currentChannel]);

  const handleSubmit = (event: FormEvent<EventTarget>) => {
    event.preventDefault();

    // If there are errors, do not submit the form
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) return;

    try {
      let data = { ...form };
      data.locale = currentLocale;
      // Update product details
      setProductSaving(true);

      // Get context jwt
      const urlParams = new URLSearchParams(window.location.search);
      const context = urlParams.get('context');

      fetch(`/api/product/${pid}?context=${context}&channel_id=${currentChannel}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then(async (res) => {
          const updatedProductLocaleData = await res.json();
          setProductData((prevData: any) => ({
            ...prevData,
            ...{
              localeData: {
                ...prevData.localeData,
                ...{ [currentLocale]: updatedProductLocaleData },
              },
            },
          }));
        })
        .finally(() => {
          setProductSaving(false);

          alertsManager.add({
            autoDismiss: true,
            messages: [
              {
                text: "Product translations have been saved.",
              },
            ],
            type: "success",
          });
        });
    } catch (error) {
      //display error
      console.error("Error updating the product: ", error);
      setProductSaving(false);
    }
  };

  const getLocaleValue = (productData: any, fieldName: string, locale: string) => {
    return productData?.localeData?.[locale]?.[fieldName];
  };

  const getFormObjectForLocale = (productData: any, locale: string) => {
    const formObject = Object.fromEntries(
      translatableProductFields.map((field) => {
        return [
          field.key,
          // getMetafieldValue(field.key, locale) || productData[field.key] || ''
          getLocaleValue(productData, field.key, locale),
        ];
      })
    );

    formObject.metafields = productData["metafields"];

    return formObject;
  };

  const defaultLocaleProductData = productData;
  const initialFormObject = getFormObjectForLocale(productData, currentLocale);

  const [form, setForm] = useState<FormData>(initialFormObject);

  const [errors, setErrors] = useState<StringKeyValue>({});

  const handleLocaleChange = (selectedLocale: any) => {
    let newFormObject = getFormObjectForLocale(productData, selectedLocale);

    setForm(newFormObject);

    setLocale(selectedLocale);
  };

  const handleChannelChange = (selectedChannel: any) => {
    setChannel(selectedChannel);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name: fieldName, value } = event?.target;

    setForm(prevForm => ({
      ...prevForm,
      [fieldName]: value,
    }));

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

  const ActionBarButtons = (
    <>
      <Button
        mobileWidth="auto"
        variant="primary"
        onClick={handleSubmit}
        disabled={isProductSaving}
        isLoading={isProductSaving}
      >
        Save
      </Button>
    </>
  );

  const channelOptions = useMemo(
    () =>
      channels.map((channel) => ({
        value: channel.id,
        content: channel.name,
      })),
    [channels]
  );

  if (hasProductInfoLoadingError) return <ErrorMessage />;

  return (
    <Loading isLoading={isProductInfoLoading}>
      <Box marginBottom="xxxLarge">
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
                      options={availableLocales.map((locale) => ({
                        value: locale.code,
                        content: `${locale.label} ${
                          locale.code === defaultLocale ? "(Default)" : ""
                        }`,
                      }))}
                      placeholder="Select Language"
                      required
                      value={currentLocale}
                      onOptionChange={handleLocaleChange}
                    />
                  </FlexItem>
                </Flex>
              </Box>
              {currentLocale === defaultLocale && (
                <Box
                  style={{
                    margin: "auto",
                    position: "fixed",
                    textAlign: "right",
                    right: "1rem",
                    width: "15rem",
                    top: "4rem",
                    backgroundColor: "white",
                    padding: "1rem",
                    opacity: "0.9",
                    zIndex: 1000,
                  }}
                >
                  <ArrowUpwardIcon color="primary60" size="xLarge" />
                  <Text color="primary60">
                    Select a locale above to start editing translations for this
                    product.
                  </Text>
                </Box>
              )}
            </FlexItem>
          </Flex>

          <HR color="secondary30" />
        </Box>

        <StyledForm fullWidth={true} onSubmit={handleSubmit}>
          {translatableProductFields.map((field) => (
            <Box key={`${field.key}_${currentLocale}`}>
              {field.type === "textarea" && (
                <Flex>
                  <FlexItem flexGrow={1} paddingBottom="medium">
                    <Box style={{ maxWidth: "40rem" }}>
                      <FormGroup>
                        <Textarea
                          label={`${field.label} (${defaultLocale})`}
                          name={`defaultLocale_${field.key}`}
                          defaultValue={defaultLocaleProductData[field.key]}
                          readOnly={true}
                          rows={5}
                          required={field.required}
                          disabled={true}
                        />
                      </FormGroup>
                    </Box>
                  </FlexItem>

                  {currentLocale !== defaultLocale && (
                    <FlexItem flexGrow={1} paddingBottom="medium">
                      <Box
                        paddingLeft={{ mobile: "none", tablet: "xLarge" }}
                        style={{ maxWidth: "40rem" }}
                      >
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
                  )}
                </Flex>
              )}
              {field.type === "input" && (
                <Flex>
                  <FlexItem flexGrow={1} paddingBottom="medium">
                    <Box style={{ maxWidth: "40rem" }}>
                      <FormGroup>
                        <Input
                          label={`${field.label} (${defaultLocale})`}
                          name={`defaultLocale_${field.key}`}
                          defaultValue={defaultLocaleProductData[field.key]}
                          readOnly={true}
                          required={field.required}
                          disabled={true}
                        />
                      </FormGroup>
                    </Box>
                  </FlexItem>

                  {currentLocale !== defaultLocale && (
                    <FlexItem flexGrow={1} paddingBottom="medium">
                      <Box
                        paddingLeft={{ mobile: "none", tablet: "xLarge" }}
                        style={{ maxWidth: "40rem" }}
                      >
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
                  )}
                </Flex>
              )}
            </Box>
          ))}

          <ActionBar>{ActionBarButtons}</ActionBar>
        </StyledForm>
      </Box>
    </Loading>
  );
}

export default ProductForm;
