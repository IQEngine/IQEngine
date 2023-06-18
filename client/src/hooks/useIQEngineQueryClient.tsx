import { CLIENT_TYPE_BLOB } from '@/api/Models';
import { QueryClient } from '@tanstack/react-query';

export function useIQEngineQueryClient() {
  const queryClient = new QueryClient();
  queryClient.setQueryDefaults(['config'], { staleTime: 1000 * 60 * 60 * 24 });
  queryClient.setQueryDefaults(['datasource', CLIENT_TYPE_BLOB], { staleTime: 1000 * 60 });

  return {
    queryClient,
  };
}
