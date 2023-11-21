import { useQuery } from '@tanstack/react-query';

export const useConvertWaveToSigmf = (wavFile: File) => {
  return useQuery({
    queryKey: ['convertWaveToSigmf', wavFile?.name ?? '', wavFile?.size ?? 0],
    queryFn: async () => {
      const formData = new FormData();
      formData.append('wav_file', wavFile);
      const response = await fetch('/api/convert/wav', {
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
