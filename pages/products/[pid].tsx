import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ErrorMessage from "@/components/error";
import ProductForm from "@/components/form";
import Loading from "@/components/loading";
import { FormData } from "@/types";
import { Box } from "@bigcommerce/big-design";

const ProductInfo = () => {
  const [isChannelsInfoLoading, setChannelsInfoLoading] = useState(true);
  const [hasChannelsInfoLoadingError, setChannelsInfoLoadingError] = useState(false);
  const [channels, setChannels] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const context = urlParams.get('context');
        const res = await fetch(`/api/channels?context=${context}`);
        const data = await res.json() as any;
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
      <Box padding="medium">
        <ProductForm
          channels={channels}
        />
      </Box>
    </Loading>
  );
};

export default ProductInfo;
