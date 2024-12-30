import { type NextRequest } from "next/server";
import { bigcommerceClient } from "@/lib/auth";
import { unstable_cache } from "next/cache";
import db from "@/lib/db";
import { authorize } from "@/lib/authorize";

async function getStoreData(
  accessToken: string | null,
  storeHash: string | undefined
) {
  const bigcommerce = bigcommerceClient(
    accessToken || "",
    storeHash || "",
    "v2"
  );
  const storeSettings = await bigcommerce.get("/store");

  return {
    multi_language_enabled:
      storeSettings?.features?.multi_language_enabled ?? false,
    multi_storefront_enabled:
      storeSettings?.features?.multi_storefront_enabled ?? false,
    language: storeSettings?.language ?? "en",
  };
}

export async function GET(request: NextRequest) {
  if (!process.env.COOKIE_NAME) {
    throw new Error("COOKIE_NAME env var is not set");
  }

  try {
    let accessToken: string | null;
    let storeHash: string | undefined;

    const authData = await authorize();
    storeHash = authData?.storeHash;

    if (storeHash === null || storeHash === undefined) {
      throw Error("Store hash is null or undefined");
    }

    accessToken = await db.getStoreToken(storeHash);

    // Cache per storeHash
    const cachedData = await unstable_cache(
      async () => getStoreData(accessToken, storeHash),
      [`store-information-${storeHash}`], // cache key
      {
        revalidate: 3600, // Cache for 1 hour
        tags: [`store-${storeHash}`], // Tag for cache invalidation
      }
    )();

    return Response.json(cachedData);
  } catch (error: any) {
    const { message, response } = error;

    return new Response(message || "Authentication failed, please re-install", {
      status: response?.status || 500,
    });
  }
}
