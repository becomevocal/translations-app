import jwt from "jsonwebtoken";
import { z } from "zod";
import { getSessionToken } from "./session";

const jwtPayloadSchema = z.object({
  userId: z.number(),
  storeHash: z.string(),
  channelId: z.nullable(z.number()),
  user: z.object({
    id: z.number(),
    email: z.string(),
    locale: z.string(),
  }),
});

export async function authorize() {
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_KEY as string);
    const parsed = jwtPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      // TODO: Add logging
      return null;
    }

    return parsed.data;
  } catch (err) {
    return null;
  }
}
