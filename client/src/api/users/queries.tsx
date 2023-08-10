import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { UserDefinition } from '../Models';
import { useAccessToken } from '@/hooks/use-access-token';

export function useGetUsers() {
  const accessToken = useAccessToken();
  return useQuery<UserDefinition[]>({
    queryKey: ['users'],
    queryFn: async () => {
      {
        const response = await axios
          .get<UserDefinition[]>('/api/users', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })
          .catch((err) => {
            console.error('Failing getting users from api', err);
            return { data: [] };
          });

        return response.data;
      }
    },
    placeholderData: [],
    enabled: !!accessToken,
  });
}
