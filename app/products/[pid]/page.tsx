"use client";

import { useParams, useSearchParams } from "next/navigation";
import ErrorMessage from "@/components/ErrorMessage";
import ProductForm from "@/components/ProductForm";
import { LoadingScreen } from "@/components/LoadingIndicator";
import { useHasMounted } from "@/hooks/useMounted";
import { useChannels } from "@/hooks/useChannels";

export default function ProductInfo() {
  const params = useParams();
  const searchParams = useSearchParams();
  const hasMounted = useHasMounted();
  const context = searchParams?.get("context");

  const {
    channels,
    isLoading: isChannelsInfoLoading,
    error: hasChannelsInfoLoadingError,
  } = useChannels(context ?? null);

  if (hasChannelsInfoLoadingError) return <ErrorMessage />;

  if (isChannelsInfoLoading)
    return <>{hasMounted ? <LoadingScreen /> : null}</>;

  return (
    <ProductForm
      channels={channels ?? []}
      productId={Number(params?.pid || 0)}
      context={context || ""}
    />
  );
}
