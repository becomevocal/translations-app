import { getRequestConfig } from "next-intl/server";
import { authClient } from "@/lib/auth";
import { getSession } from "@/lib/session";

export default getRequestConfig(async () => {
  let userLocale = "en-US"; // default fallback

  try {
    const sessionToken = await getSession();

    if (sessionToken) {
      const payload = await authClient.decodeSessionPayload(sessionToken) as { userLocale?: string };

      if (payload?.userLocale) {
        userLocale = payload.userLocale;
      }
    }
  } catch (error) {
    // Silently fall back to default locale on error
  }

  if (process.env.DB_TYPE === "explicit_store_token") {
    userLocale = process.env.HARDCODED_LOCALE as string;
  }

  let messages;
  try {
    messages = (await import(`../messages/${userLocale}.json`)).default;
  } catch (error) {
    // Not all locales are translated, so fallback to a message file that exists
    // if the requested message file is not found
    userLocale = "en-US";
    messages = (await import("../messages/en-US.json")).default;
  }

  return {
    locale: userLocale,
    messages,
  };
});
