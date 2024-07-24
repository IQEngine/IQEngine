import { useQuery } from '@tanstack/react-query';

export const useConvertVitaToSigmf = (file: File) => {
  return useQuery({
    queryKey: ['convertVitaToSigmf', file?.name ?? '', file?.size ?? 0],
    queryFn: async () => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/convert/vita49', {
        method: 'POST',
        body: formData,
      });
      const data = await response.blob();
      return data;
    },
    cacheTime: 0,
    enabled: false,
  });
};
