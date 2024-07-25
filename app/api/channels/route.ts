import { type NextRequest } from 'next/server'
import { bigcommerceClient, getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest
) {
  const searchParams = request.nextUrl.searchParams
  const context = searchParams.get('context') ?? ''

  try {
    const { accessToken, storeHash } = await getSession({ query: { context } });
    const bigcommerce = bigcommerceClient(accessToken, storeHash);

    const { data: channelsData } = await bigcommerce.get(
      `/channels`
    );

    return Response.json(channelsData);
  } catch (error: any) {
    const { message, response } = error;

    return new Response(message || "Authentication failed, please re-install", {
      status: response?.status || 500,
    });
  }
}

// export const runtime = 'edge';