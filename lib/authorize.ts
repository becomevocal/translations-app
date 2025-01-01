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

export const LoadCallbackJwtPayloadSchema = z.object({
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

export const sessionPayloadSchema = LoadCallbackJwtPayloadSchema.extend({
  userId: z.number(),
  email: z.string(),
  channelId: z.number().nullable(),
  storeHash: z.string(),
  locale: z.string().optional(),
});

export async function authorize() {
  const token = await getSessionToken();

  if (!token) {
    console.log('No token found');
    return null;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_KEY as string);
    const parsed = sessionPayloadSchema.safeParse(payload);

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
