import { CLIENT_TYPE_BLOB } from '@/api/Models';
import { QueryClient } from '@tanstack/react-query';

export function useQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  });
  queryClient.setQueryDefaults(['config'], { staleTime: 1000 * 60 * 60 * 24 });
  queryClient.setQueryDefaults(['datasource', CLIENT_TYPE_BLOB], { staleTime: 1000 * 60 });
  queryClient.setQueryDefaults(['plugins'], { staleTime: 1000 * 60 * 5 });
  queryClient.setQueryDefaults(['rawiqdata'], { staleTime: Infinity });
  queryClient.setQueryDefaults(['iqData'], { staleTime: 5, cacheTime: 10 });
  queryClient.setQueryDefaults(['user-settings'], { staleTime: Infinity });
  queryClient.setQueryDefaults(['smart-query'], { staleTime: 1000 * 60 * 60 * 24 });

  return {
    queryClient,
  };
}
