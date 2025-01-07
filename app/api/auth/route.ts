import { type NextRequest, NextResponse } from "next/server";
import { dbClient as db } from "@/lib/db";
import { createAppExtension } from "@/lib/app-extensions";
import { BigCommerceClient } from "@/lib/bigcommerce-client";
import { oauthResponseSchema, queryParamSchema } from "@/lib/authorize";

export async function GET(req: NextRequest) {
  const parsedParams = queryParamSchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  );

  if (!parsedParams.success) {
    return new NextResponse("Invalid query parameters", { status: 400 });
  }

  const oauthResponse = await fetch(`https://login.bigcommerce.com/oauth2/token`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code: parsedParams.data.code,
      context: parsedParams.data.context,
      scope: parsedParams.data.scope,
      grant_type: "authorization_code",
      redirect_uri: process.env.AUTH_CALLBACK,
    }),
  });

  const body = await oauthResponse.json();

  const parsedOAuthResponse = oauthResponseSchema.safeParse(body);

  if (!parsedOAuthResponse.success) {
    return new NextResponse("Invalid access token response", { status: 500 });
  }

  const {
    access_token: accessToken,
    context,
    scope,
    user: oauthUser,
    owner: authOwner,
    account_uuid: accountUuid,
  } = parsedOAuthResponse.data;

  const storeHash = context.split("/")[1];

  if (!storeHash) {
    return new NextResponse("Invalid store hash", { status: 400 });
  }

  await db.setStore({
    access_token: accessToken,
    context,
    store_hash: storeHash,
    scope,
    user: oauthUser,
    owner: authOwner,
    account_uuid: accountUuid,
  });
  await db.setUser(oauthUser);
  await db.setStoreUser({
    access_token: accessToken,
    context,
    store_hash: storeHash,
    scope,
    user: oauthUser,
    owner: authOwner,
    account_uuid: accountUuid,
  });

  /**
   * For stores that do not have the app installed yet, create App Extensions when app is
   * installed.
   */
  const isAppExtensionsScopeEnabled = scope.includes(
    "store_app_extensions_manage"
  );
  if (isAppExtensionsScopeEnabled && storeHash) {
    await createAppExtension({ accessToken, storeHash });
  } else {
    console.warn(
      "WARNING: App extensions scope is not enabled yet. To register app extensions update the scope in Developer Portal: https://devtools.bigcommerce.com"
    );
  }

  // Since the auth callback *doesn't* return a user.locale, we need to use the browser locale.
  // (When the user loads the app after it's auth'd, the load callback *does* return a user.locale
  const userBrowserLocale = req.headers.get('Accept-Language')?.split(',')[0] || 'en-US';

  const clientToken = await BigCommerceClient.encodeSessionPayload({
    userId: oauthUser.id,
    userEmail: oauthUser.email,
    channelId: null,
    storeHash,
    userLocale: userBrowserLocale
  }, process.env.JWT_KEY as string);

  await BigCommerceClient.setSession(clientToken, storeHash);

  const response = NextResponse.redirect(`${process.env.APP_ORIGIN}/?context=${clientToken}`, {
    status: 302,
    statusText: "Found",
  });

  return response;
}
