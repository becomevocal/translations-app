import { z } from "zod";
import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { QueryParams, SessionContextProps, SessionProps } from "../types";
import db from "./db";
import { BigCommerceClient } from "./bigcommerce-client";
import { appSessionPayloadSchema } from "./authorize";

const {
  API_URL,
  AUTH_CALLBACK,
  CLIENT_ID,
  CLIENT_SECRET,
  JWT_KEY = "",
  LOGIN_URL,
  DB_TYPE,
  HARDCODED_ACCESS_TOKEN,
  HARDCODED_STORE_HASH,
} = process.env;

export const bigcommerceClient = new BigCommerceClient({
  clientId: CLIENT_ID || "",
  secret: CLIENT_SECRET,
  callback: AUTH_CALLBACK,
  headers: { "Accept-Encoding": "*" },
  // Used for internal testing across different environments
  apiUrl: API_URL,
  loginUrl: LOGIN_URL,
});

// Authorizes app on install
export function getBCAuth(query: QueryParams) {
  return bigcommerceClient.authorize(query);
}

export async function getSession({ query: { context = "" } }) {
  if (typeof context !== "string") return;

  if (DB_TYPE === "hardcoded") {
    return {
      accessToken: HARDCODED_ACCESS_TOKEN,
      storeHash: HARDCODED_STORE_HASH,
      user: null,
    } as any;
  }

  const { storeHash, userId, userEmail, userLocale } = (await decodeSessionPayload(context)) as z.infer<
    typeof appSessionPayloadSchema
  > & { context: string; user: any };
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

// JWT functions to sign/ verify 'context' query param from /api/auth || /api/load
export async function encodeSessionPayload(
  payload: z.infer<typeof appSessionPayloadSchema>,
  expiration: number | string | Date = "1h"
) {
  return await new SignJWT({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    nbf: Math.floor(Date.now() / 1000),
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expiration)
    .sign(new TextEncoder().encode(JWT_KEY));
}

// Verifies JWT for getSession
export async function decodeSessionPayload(encodedContext: string) {
  const { payload } = await jwtVerify(
    encodedContext,
    new TextEncoder().encode(JWT_KEY)
  );

  return payload as z.infer<typeof appSessionPayloadSchema>;
}

// Removes store and storeUser on uninstall
export async function removeDataStore(session: SessionProps) {
  if (!session.store_hash) return;

  await db.deleteStore(session.store_hash);
  if (session.user) {
    await db.deleteUser(session.store_hash, session.user);
  }
}

// Removes users from app - getSession() for user will fail after user is removed
export async function removeUserData(session: SessionProps) {
  if (!session.store_hash) return;
  
  await db.deleteUser(session.store_hash, {
    id: session.user.id,
    email: session.user.email,
    username: session.user.username
  });
}

// Removes user from storeUsers on logout
export async function logoutUser({ storeHash, user }: SessionContextProps) {
  await db.deleteUser(storeHash, {
    id: user.id,
    email: user.email,
    username: user.username
  });
}
