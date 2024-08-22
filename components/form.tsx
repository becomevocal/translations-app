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
  Text,
  FlexItem,
  FormGroup,
} from "@bigcommerce/big-design";
import { theme } from "@bigcommerce/big-design-theme";
import { alertsManager } from "@/pages/_app";
import { useRouter } from "next/router";
import { ArrowUpwardIcon } from "@bigcommerce/big-design-icons";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { FormData, StringKeyValue } from "@/types";
import { defaultLocale, translatableProductFields } from "@/lib/constants";
import { ActionBar } from "bigcommerce-design-patterns";
import ErrorMessage from "./error";
import Loading from "./loading";
import Editor from "./TinyEditor";

interface FormProps {
  channels: {
    channel_id: number;
    channel_name: string;
    locales: {
      code: string;
      status: string;
      is_default: boolean;
      title: string;
    }[];
  }[];
}

interface FormErrors {
  [key: string]: string;
}

const FormErrors: FormErrors = {};

function ProductForm({ channels }: FormProps) {
  const router = useRouter();
  const pid = Number(router.query?.pid);
  const [currentChannel, setChannel] = useState<number>(channels[0].channel_id);
  const [currentLocale, setLocale] = useState<string>(
    channels[0].locales[0].code
  );
  const [productData, setProductData] = useState<any>({});
  const [isProductInfoLoading, setProductInfoLoading] = useState(true);
  const [hasProductInfoLoadingError, setProductInfoLoadingError] =
    useState(false);
  const [isProductSaving, setProductSaving] = useState(false);

  useEffect(() => {
    const fetchProductData = async () => {
      setProductInfoLoading(true);
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const context = urlParams.get("context");
        const res = await fetch(
          `/api/product/${pid}?context=${context}&channel_id=${currentChannel}`
        );
        const data = (await res.json()) as any;
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
      const context = urlParams.get("context");

      fetch(
        `/api/product/${pid}?context=${context}&channel_id=${currentChannel}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      )
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

  const getLocaleValue = (
    productData: any,
    fieldName: string,
    locale: string
  ) => {
    return productData?.localeData?.[locale]?.[fieldName];
  };

  const getFormObjectForLocale = (productData: any, locale: string) => {
    const formObject = Object.fromEntries(
      translatableProductFields.map((field) => {
        return [field.key, getLocaleValue(productData, field.key, locale)];
      })
    );

    return formObject;
  };

  const defaultLocaleProductData = productData;
  const initialFormObject = getFormObjectForLocale(productData, currentLocale);

  const [form, setForm] = useState<FormData>(initialFormObject);

  const [errors, setErrors] = useState<StringKeyValue>({});

  const handleLocaleChange = (selectedLocale: string) => {
    let newFormObject = getFormObjectForLocale(productData, selectedLocale);
    setForm(newFormObject);
    setLocale(selectedLocale);
  };

  const handleChannelChange = (selectedChannelId: number) => {
    const selectedChannel = channels.find(
      (channel) => channel.channel_id === selectedChannelId
    );
    if (selectedChannel) {
      setChannel(selectedChannelId);
      // Select first non-default locale when switching channels, since the default locale can't be edited
      setLocale(
        selectedChannel.locales?.[1]?.code || selectedChannel.locales[0].code
      );
    }
  };

  const handleEditorChange = (content: string, fieldName: string) => {
    setForm((prevForm) => ({
      ...prevForm,
      [fieldName]: content,
    }));
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name: fieldName, value } = event?.target;

    setForm((prevForm) => ({
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
        value: channel.channel_id,
        content: channel.channel_name,
      })),
    [channels]
  );

  const selectedChannel = channels.find(
    (channel) => channel.channel_id === currentChannel
  );
  const localeOptions = selectedChannel
    ? selectedChannel.locales.map((locale) => ({
        value: locale.code,
        content: `${locale.title} ${
          locale.code === defaultLocale ? "(Default)" : ""
        }`,
      }))
    : [];

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
                      options={localeOptions}
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
                      initialValue={defaultLocaleProductData[field.key]}
                      isDisabled={true}
                    />
                  </GridItem>

                  {currentLocale !== defaultLocale && (
                    <GridItem>
                      <Editor
                        label={`${field.label} (${currentLocale})`}
                        initialValue={form[field.key]}
                        onChange={(content: string) => {
                          handleEditorChange(content, field.key);
                        }}
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
                        defaultValue={defaultLocaleProductData[field.key]}
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
                          value={form[field.key]}
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
      </Box>
    </Loading>
  );
}

export default ProductForm;
