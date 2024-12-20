import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import db from "@/lib/db";
import { encodePayload } from "@/lib/auth";
import { createSession, setSession } from "@/lib/session";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies, type UnsafeUnwrappedCookies } from "next/headers";

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

const jwtSchema = z.object({
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

const buildRedirectUrl = (url: string, encodedContext: string) => {
    const [path, query = ''] = url.split('?');
    const queryParams = new URLSearchParams(`context=${encodedContext}&${query}`);

    return `${path}?${queryParams}`;
}

export async function GET(req: NextRequest) {
  const rUrl = new URL(req.nextUrl);

  const signed_payload_jwt = rUrl.searchParams.get("signed_payload_jwt");

  if (!signed_payload_jwt) {
    return new NextResponse("Missing signed_payload_jwt", { status: 401 });
  }

  const { payload } = await jwtVerify(
    signed_payload_jwt,
    new TextEncoder().encode(process.env.CLIENT_SECRET)
  );

  const parsedJwt = jwtSchema.safeParse(payload);

  if (!parsedJwt.success) {
    return new NextResponse("JWT properties invalid", { status: 403 });
  }

  const { sub, url: path, user } = parsedJwt.data;

  const storeHash = sub.split("/")[1] as string;

  const clientToken = await new SignJWT({
    ...payload,
    exp: payload.exp,
    iat: payload.iat,
    nbf: payload.iat,
    userId: user.id,
    channelId: payload.channel_id,
    storeHash,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .sign(new TextEncoder().encode(process.env.JWT_KEY));

  // create new searchParams preserving the existing ones but removing the signed_payload_jwt
  const newSearchParams = new URLSearchParams(rUrl.searchParams.toString());
  newSearchParams.delete("signed_payload_jwt");
  newSearchParams.delete("signed_payload");

  // await setSession(clientToken, storeHash);
  const { name, value, config } = await createSession(clientToken, storeHash);
  const cookieStore = await cookies()
  cookieStore.set(name, value, config)

  const encodedContext = encodePayload({
    context: parsedJwt.data.sub,
    user: parsedJwt.data.user,
    owner: parsedJwt.data.owner,
  });

  const response = NextResponse.redirect(
    `${process.env.APP_ORIGIN}${buildRedirectUrl(parsedJwt.data.url ?? '/', `${encodedContext}&${newSearchParams.toString()}`)}`,
    {
      status: 307,
    }
  );

  response.cookies.set(name, value, config);

  return response;
}
