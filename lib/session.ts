import "server-only";
import { cookies } from "next/headers";

const COOKIE_NAME = process.env.COOKIE_NAME;

export async function createSession(clientToken: string, storeHash: string) {
  if (!COOKIE_NAME) {
    throw new Error("COOKIE_NAME env var is not set");
  }

  return {
    name: COOKIE_NAME,
    value: clientToken,
    config: {
      httpOnly: true,
      secure: true, // Change to false when localhost
      sameSite: "none" as const, // Change to "lax" when localhost
      maxAge: 3600,
    },
  };
}

export async function setSession(clientToken: string, storeHash: string) {
  const { name, value, config } = await createSession(clientToken, storeHash);
  (await cookies()).set(name, value, config);
}

export async function getSessionToken() {
  if (!COOKIE_NAME) {
    throw new Error("COOKIE_NAME env var is not set");
  }

  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(COOKIE_NAME);

  return tokenCookie?.value;
}
