import { type NextRequest } from 'next/server'
import { bigcommerceClient, getSession } from "@/lib/auth";

type Channel = {
  id: number;
  name: string;
  [key: string]: any; // This allows for other properties that might be present
};

export async function GET(
  request: NextRequest
) {
  const searchParams = request.nextUrl.searchParams
  const context = searchParams.get('context') ?? ''

  try {
    const { accessToken, storeHash } = await getSession({ query: { context } });
    const bigcommerce = bigcommerceClient(accessToken, storeHash);

    const { data: channelsData } = await bigcommerce.get('/channels');

    const result = await Promise.all(channelsData.map(async (channel: Channel) => {
      try {
        const { data: localesData } = await bigcommerce.get(`/settings/store/locales?channel_id=${channel.id}`);
        return {
          channel_id: channel.id,
          channel_name: channel.name,
          locales: localesData
        };
      } catch (innerError) {
        console.error(`Failed to fetch locales for channel ${channel.id}:`, innerError);
        // Return mock data with only English locale
        return {
          channel_id: channel.id,
          channel_name: channel.name,
          locales: [
            {
              code: "en",
              status: "active",
              is_default: true
            }
          ]
        };
      }
    }));
    
    return Response.json(result);
  } catch (error: any) {
    const { message, response } = error;

    return new Response(message || "Authentication failed, please re-install", {
      status: response?.status || 500,
    });
  }
}

// export const runtime = 'edge';