import { useEffect, useState } from "react";
import ErrorMessage from "@/components/ErrorMessage";
import ProductForm from "@/components/ProductForm";
import Loading from "@/components/LoadingIndicator";

const ProductInfo = () => {
  const [isChannelsInfoLoading, setChannelsInfoLoading] = useState(true);
  const [hasChannelsInfoLoadingError, setChannelsInfoLoadingError] =
    useState(false);
  const [channels, setChannels] = useState<
    {
      channel_id: number;
      channel_name: string;
      locales: {
        code: string;
        status: string;
        is_default: boolean;
        title: string;
      }[];
    }[]
  >([]);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const context = urlParams.get("context");
        const res = await fetch(`/api/channels?context=${context}`);
        const data = (await res.json()) as any;
        setChannels(data);
      } catch (error) {
        setChannelsInfoLoadingError(true);
      } finally {
        setChannelsInfoLoading(false);
      }
    };

    fetchChannels();
  }, []);

  if (hasChannelsInfoLoadingError) return <ErrorMessage />;

  return (
    <Loading isLoading={isChannelsInfoLoading}>
      <ProductForm channels={channels} />
    </Loading>
  );
};

export default ProductInfo;
