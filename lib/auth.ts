import { z } from "zod";
import { dbClient as db } from "@/lib/db";
import { BigCommerceAuthClient } from "./bigcommerce-auth-client";
import { appSessionPayloadSchema, signedPayloadJwtSchema } from "./schemas";

const {
  DB_TYPE,
  HARDCODED_ACCESS_TOKEN,
  HARDCODED_STORE_HASH,
} = process.env;

export const authClient = new BigCommerceAuthClient({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callback: process.env.AUTH_CALLBACK,
  jwtKey: process.env.JWT_KEY,
});

export async function getSessionFromContext(context: string = "") {
  if (typeof context !== "string") return;

  if (DB_TYPE === "explicit_store_token") {
    return {
      accessToken: HARDCODED_ACCESS_TOKEN,
      storeHash: HARDCODED_STORE_HASH,
      user: null,
    } as any;
  }

  const { storeHash, userId, userEmail, userLocale } =
    (await authClient.decodeSessionPayload(
      context
    )) as z.infer<typeof appSessionPayloadSchema> & {
      context: string;
      user: any;
    };
  const hasUser = await db.hasStoreUser(storeHash, userId);

  // Before retrieving session/ hitting APIs, check user
  if (!hasUser) {
    throw new Error(
      "User is not available. Please login or ensure you have access permissions."
    );
  }

  const accessToken = await db.getStoreToken(storeHash);

  return { accessToken, storeHash, userId, userEmail, userLocale } as any;
}

// Removes store and storeUser from database
export async function removeStoreData(session: z.infer<typeof signedPayloadJwtSchema>) {
  const storeHash = session.sub.split("/")[1];
  if (!storeHash) return;

  await db.deleteStore(storeHash);
  if (session.user) {
    await db.deleteUser(storeHash, {
      id: session.user.id,
      email: session.user.email,
    });
  }
}

// Removes users from database
export async function removeUserData(session: z.infer<typeof signedPayloadJwtSchema>) {
  const storeHash = session.sub.split("/")[1];
  if (!storeHash) return;

  await db.deleteUser(storeHash, {
    id: session.user.id,
    email: session.user.email,
  });
}
