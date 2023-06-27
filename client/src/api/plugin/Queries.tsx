import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { PluginDefinition } from '../Models';

export function useGetPlugins() {
  return useQuery<PluginDefinition[]>(
    ['plugins'],
    async () => {
      const response = await axios.get<PluginDefinition[]>('/api/plugins').catch((err) => {
        console.log('useGetPlugins error', err);
        return { data: [] };
      });
      return response.data;
    },
    {
      placeholderData: [],
    }
  );
}
