import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ProcessorDefinition } from '../Models';

export function useGetProcessors() {
  return useQuery<ProcessorDefinition[]>(
    ['processors'],
    async () => {
      const response = await axios.get<ProcessorDefinition[]>('/api/processors').catch((err) => {
        console.log('useGetProcessors error', err);
        return { data: [] };
      });
      return response.data;
    },
    {
      placeholderData: [],
    }
  );
}
