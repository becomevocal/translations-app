import { NextRequest, NextResponse } from "next/server";
import { authClient, removeUserData } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const signed_payload_jwt = searchParams.get("signed_payload_jwt");

    if (!signed_payload_jwt) {
      return new NextResponse("Missing signed_payload_jwt", { status: 401 });
    }

    const session = await authClient.verifyBigCommerceJWT(signed_payload_jwt);
    await removeUserData(session);

    return new NextResponse(null, { status: 200 });
  } catch (error: any) {
    const { message, response } = error;
    return new NextResponse(message, { status: response?.status || 500 });
  }
} 