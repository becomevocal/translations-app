import { type NextRequest } from "next/server";

interface Locale {
  code: string;
  status: string;
  is_default: boolean;
}

interface LocalesResponse {
  data: Locale[];
  meta: Record<string, unknown>;
}

const mockLocalesData: LocalesResponse = {
  data: [
    { code: "en-US", status: "active", is_default: true },
    { code: "es-ES", status: "active", is_default: false },
    { code: "fr-FR", status: "inactive", is_default: false },
  ],
  meta: {},
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const channelId = searchParams.get("channel_id");

  if (!channelId) {
    return new Response(
      JSON.stringify({ error: "channel_id query parameter is required" }),
      {
        status: 400,
      }
    );
  }

  return Response.json(mockLocalesData);
}

// export const runtime = 'edge';
