import { cookies } from 'next/headers';

const COOKIE_NAME = process.env.COOKIE_NAME || "bigcommerce-app-token";

export const DEFAULT_COOKIE_CONFIG = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  maxAge: 3600,
  path: "/",
};

export async function getSession(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function setSession(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, DEFAULT_COOKIE_CONFIG);
}

export async function removeSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
} 