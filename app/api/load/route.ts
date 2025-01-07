import { type NextRequest, NextResponse } from "next/server";
import { BigCommerceClient } from "@/lib/bigcommerce-client";
import { loadCallbackJwtPayloadSchema } from "@/lib/authorize";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

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

  const parsedJwt = loadCallbackJwtPayloadSchema.safeParse(payload);

  if (!parsedJwt.success) {
    return new NextResponse("JWT properties invalid", { status: 403 });
  }

  const { sub, url: path, user } = parsedJwt.data;

  const storeHash = sub.split("/")[1] as string;

  const clientToken = await BigCommerceClient.encodeSessionPayload({
    userId: user.id,
    userEmail: user.email,
    channelId: Number(payload?.channel_id) || null,
    storeHash,
    userLocale: user.locale
  }, process.env.JWT_KEY as string);

  // create new searchParams preserving the existing ones but removing the signed_payload_jwt
  const newSearchParams = new URLSearchParams(rUrl.searchParams.toString());
  newSearchParams.delete("signed_payload_jwt");
  newSearchParams.delete("signed_payload");

  // await setSession(clientToken, storeHash);
  const { name, value, config } = await BigCommerceClient.createSession(clientToken, storeHash);
  const cookieStore = await cookies()
  cookieStore.set(name, value, config)

  const response = NextResponse.redirect(
    `${process.env.APP_ORIGIN}${buildRedirectUrl(parsedJwt.data.url ?? '/', `${clientToken}&${newSearchParams.toString()}`)}`,
    {
      status: 307,
    }
  );

  response.cookies.set(name, value, config);

  return response;
}
