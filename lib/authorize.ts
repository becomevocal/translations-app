import { z } from "zod";
import { BigCommerceClient } from "./bigcommerce-client";

export const queryParamSchema = z.object({
  code: z.string(),
  scope: z.string(),
  context: z.string(),
});

export const oauthResponseSchema = z.object({
  access_token: z.string(),
  scope: z.string(),
  user: z.object({
    id: z.number(),
    username: z.string(),
    email: z.string(),
  }),
  owner: z.object({
    id: z.number(),
    username: z.string(),
    email: z.string(),
  }),
  context: z.string(),
  account_uuid: z.string(),
});

export const loadCallbackJwtPayloadSchema = z.object({
  aud: z.string(),
  iss: z.string(),
  iat: z.number(),
  nbf: z.number(),
  exp: z.number(),
  jti: z.string(),
  sub: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string().email(),
    locale: z.string(),
  }),
  owner: z.object({
    id: z.number(),
    email: z.string().email(),
  }),
  url: z.string(),
  channel_id: z.number().nullable(),
});

export const appSessionPayloadSchema = z.object({
  channelId: z.number().nullable(),
  storeHash: z.string().min(1),
  userId: z.number(),
  userEmail: z.string(),
  userLocale: z.string().optional(),
});

type AuthData = null | {
  channelId: number | null;
  storeHash: NonNullable<string>;
  userId: number;
  userEmail: string;
  userLocale?: string;
};

export async function authorize(): Promise<AuthData> {
  if (process.env.DB_TYPE === "explicit_store_token") {
    return {
      channelId: null,
      storeHash: process.env.HARDCODED_STORE_HASH as string,
      userId: 0,
      userEmail: "mock@example.com",
      userLocale: process.env.HARDCODED_LOCALE
    };
  }

  const token = await BigCommerceClient.getSessionFromCookie();

  if (!token) {
    console.log('No token found');
    return null;
  }

  try {
    const payload = await BigCommerceClient.verifyJWT(token, process.env.JWT_KEY as string);
    const parsed = appSessionPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      console.log('JWT schema validation failed:', parsed.error);
      return null;
    }

    return parsed.data;
  } catch (err) {
    console.log('JWT verification failed:', err);
    return null;
  }
}
