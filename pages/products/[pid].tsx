import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { alertsManager } from "@/pages/_app";
import ErrorMessage from "@/components/error";
import ProductForm from "@/components/form";
import Loading from "@/components/loading";
import { FormData } from "@/types";
import { Box } from "@bigcommerce/big-design";

const ProductInfo = () => {
  const router = useRouter();
  const pid = Number(router.query?.pid);
  const [productData, setProductData] = useState<any>({});
  const [isProductInfoLoading, setProductInfoLoading] = useState(true);
  const [hasProductInfoLoadingError, setProductInfoLoadingError] = useState(false);
  const [isProductSaving, setProductSaving] = useState(false);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const context = urlParams.get('context');
        const res = await fetch(`/api/product/${pid}?context=${context}`);
        const data = await res.json() as any;
        setProductData(data);
      } catch (error) {
        setProductInfoLoadingError(true);
      } finally {
        setProductInfoLoading(false);
      }
    };

    if (pid) {
      fetchProductData();
    }
  }, [pid]);

  const {
    description,
    is_visible: isVisible,
    localeData,
    name,
    metafields,
  } = productData;
  const formData = { description, isVisible, localeData, name, metafields };

  const handleCancel = () => router.push("/");

  const handleSubmit = (data: FormData, selectedLocale: string) => {
    try {
      data.locale = selectedLocale;
      // Update product details
      setProductSaving(true);

      // Get context jwt
      const urlParams = new URLSearchParams(window.location.search);
      const context = urlParams.get('context');

      fetch(`/api/product/${pid}?context=${context}`, {
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
                ...{ [selectedLocale]: updatedProductLocaleData },
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

  if (hasProductInfoLoadingError) return <ErrorMessage />;

  return (
    <Loading isLoading={isProductInfoLoading}>
      <Box padding="medium">
        <ProductForm
          formData={formData}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          isSaving={isProductSaving}
        />
      </Box>
    </Loading>
  );
};

export default ProductInfo;
