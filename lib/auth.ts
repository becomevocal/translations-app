import { z } from "zod";
import { AuthSession } from "../types";
import { dbClient as db } from "@/lib/db";
import { BigCommerceClient } from "./bigcommerce-client";
import { appSessionPayloadSchema } from "./authorize";

const {
  DB_TYPE,
  HARDCODED_ACCESS_TOKEN,
  HARDCODED_STORE_HASH,
} = process.env;


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
    (await BigCommerceClient.decodeSessionPayload(
      context,
      process.env.JWT_KEY as string
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
export async function removeStoreData(session: AuthSession) {
  if (!session.store_hash) return;

  await db.deleteStore(session.store_hash);
  if (session.user) {
    await db.deleteUser(session.store_hash, session.user);
  }
}

// Removes users from database
export async function removeUserData(session: AuthSession) {
  if (!session.store_hash) return;

  await db.deleteUser(session.store_hash, {
    id: session.user.id,
    email: session.user.email,
    username: session.user.username,
  });
}
