// hooks/useChannels.ts
import useSWR from 'swr';

interface Channel {
  channel_id: number;
  channel_name: string;
  locales: {
    code: string;
    status: string;
    is_default: boolean;
    title: string;
  }[];
}

const fetcher = async (url: string): Promise<Channel[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch channels');
  return res.json();
};

export function useChannels(context: string | null) {
  const { data, error, isLoading } = useSWR<Channel[]>(
    context ? `/api/channels?context=${context}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  return {
    channels: data,
    isLoading,
    error,
  };
}
