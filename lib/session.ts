import "server-only";
import { cookies } from "next/headers";

const COOKIE_NAME = "catalyst-app-token";

export async function createSession(clientToken: string, storeHash: string) {
  return {
    name: COOKIE_NAME,
    value: clientToken,
    config: {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      maxAge: 3600,
      partitioned: true,
    },
  };
}

export async function setSession(clientToken: string, storeHash: string) {
  const { name, value, config } = await createSession(clientToken, storeHash);
  cookies().set(name, value, config);
}

export function getSessionToken() {
  const tokenCookie = cookies().get(COOKIE_NAME);
  return tokenCookie?.value;
}
