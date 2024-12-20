import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import db from "@/lib/db";
import { createAppExtension } from "@/lib/appExtensions";
import { encodePayload } from "@/lib/auth";
import { setSession, createSession } from "@/lib/session";
import { SignJWT } from "jose";

const queryParamSchema = z.object({
  code: z.string(),
  scope: z.string(),
  context: z.string(),
});

const oauthResponseSchema = z.object({
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
  } = parsedOAuthResponse.data;

  const storeHash = context.split("/")[1];

  if (!storeHash) {
    return new NextResponse("Invalid store hash", { status: 400 });
  }

  await db.setStore({
    access_token: accessToken,
    context,
    scope,
    user: oauthUser,
  });
  await db.setUser(oauthUser);
  await db.setStoreUser({
    access_token: accessToken,
    context,
    scope,
    user: oauthUser,
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

  const clientToken = await new SignJWT({
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    iat: Math.floor(Date.now() / 1000),
    nbf: Math.floor(Date.now() / 1000),
    userId: oauthUser.id,
    path : "/",
    channelId: null,
    storeHash,
  })
  .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
  .sign(new TextEncoder().encode(process.env.JWT_KEY));

  // await setSession(clientToken, storeHash);
  const { name, value, config } = await createSession(clientToken, storeHash);

  const encodedContext = encodePayload({ context, user: oauthUser, owner: authOwner });

  const response = NextResponse.redirect(`${process.env.APP_ORIGIN}/?context=${encodedContext}`, {
    status: 302,
    statusText: "Found",
  });

  response.cookies.set(name, value, config);

  return response;
}
