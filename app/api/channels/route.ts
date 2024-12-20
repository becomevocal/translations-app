import { type NextRequest } from 'next/server'
import { bigcommerceClient, getSession } from "@/lib/auth";
import { hardcodedAvailableLocales } from '@/lib/constants';
import { unstable_cache } from 'next/cache';

type Channel = {
  id: number;
  name: string;
  [key: string]: any;
};

export async function GET(
  request: NextRequest
) {
  const searchParams = request.nextUrl.searchParams
  const context = searchParams.get('context') ?? ''

  try {
    const { accessToken, storeHash } = await getSession({ query: { context } });
    const bigcommerce = bigcommerceClient(accessToken, storeHash);

    const getChannelsData = async () => {
      const { data: channelsData } = await bigcommerce.get('/channels?available=true');

      const result = await Promise.all(channelsData.map(async (channel: Channel) => {
        try {
          const { data: localesData } = await bigcommerce.get(`/settings/store/locales?channel_id=${channel.id}`);
          return {
            channel_id: channel.id,
            channel_name: channel.name,
            locales: localesData.map((locale: { code: string, status: string, is_default: boolean }) => ({
              ...locale,
              title: hardcodedAvailableLocales.find(({ id }) => id === locale.code)?.name,
            }))
          };
        } catch (innerError) {
          console.error(`Failed to fetch locales for channel ${channel.id}:`, innerError);
          return {
            channel_id: channel.id,
            channel_name: channel.name,
            locales: [
              {
                code: "en",
                status: "active",
                is_default: true,
                title: "English"
              }
            ]
          };
        }
      }));

      return result;
    };

    // Cache per storeHash
    const cachedData = await unstable_cache(
      getChannelsData,
      [`channels-${storeHash}`], // cache key
      {
        revalidate: 3600, // Cache for 1 hour
        tags: [`store-${storeHash}`], // Tag for cache invalidation
      }
    )();
    
    return Response.json(cachedData);
  } catch (error: any) {
    const { message, response } = error;

    return new Response(message || "Authentication failed, please re-install", {
      status: response?.status || 500,
    });
  }
}
