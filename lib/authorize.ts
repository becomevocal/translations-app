import { authClient } from "@/lib/auth";
import { getSession } from "./session";
import { appSessionPayloadSchema } from "./schemas";

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

  const token = await getSession();

  if (!token) {
    console.log('No session token found');
    return null;
  }

  try {
    const payload = await authClient.verifyAppJWT(token);
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
