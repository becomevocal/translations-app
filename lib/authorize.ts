import jwt from "jsonwebtoken";
import { z } from "zod";
import { getSessionToken } from "./session";

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
  const token = await getSessionToken();

  if (!token) {
    console.log('No token found');
    return null;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_KEY as string);
    const parsed = appSessionPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      console.log('Schema validation failed:', parsed.error);
      return null;
    }

    return parsed.data;
  } catch (err) {
    console.log('JWT verification failed:', err);
    return null;
  }
}
