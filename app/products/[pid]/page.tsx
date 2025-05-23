"use client";

import { useParams, useSearchParams } from "next/navigation";
import ErrorMessage from "@/components/error-message";
import ProductForm from "@/components/product-form";
import { LoadingScreen } from "@/components/loading-indicator";
import { useHasMounted } from "@/hooks/useMounted";
import { useChannels } from "@/hooks/useChannels";
import { Suspense } from "react";

function ProductInfoContent() {
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

export default function ProductInfo() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ProductInfoContent />
    </Suspense>
  );
}
