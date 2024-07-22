import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { JobOutput, JobStatus, PluginBody } from '../Models';

export const useRunPlugin = (pluginURL: string) => {
  return useMutation<JobStatus, unknown, PluginBody | null>(async (pluginBody) => {
    let formData = new FormData();
    formData.append('iq_file', pluginBody.iq_file);
    formData.append('metadata_file', JSON.stringify(pluginBody.metadata_file));
    formData.append('custom_params', JSON.stringify(pluginBody.custom_params));
    const response = await fetch(pluginURL, {
      method: 'POST',
      body: formData,
    });
    const data: JobStatus = await response.json();
    return data;
  });
};

export const useGetJobStatus = (pluginURL: string, jobID: string): UseQueryResult<JobStatus, unknown> => {
  return useQuery<JobStatus>(
    ['job', jobID, 'status'],
    async () => {
      const baseURL = pluginURL.split('/').slice(0, -1).join('/'); // url with out rf function name
      const response = await fetch(baseURL + `/${jobID}/status`);

      return response.json();
    },
    {
      enabled: jobID != null,
      cacheTime: 0,
      refetchInterval(data, _) {
        if (data?.progress === 100) {
          return false;
        }
        return 500;
      },
    }
  );
};

export const useGetJobOutput = (pluginURL: string, jobStatus: JobStatus): UseQueryResult<JobOutput, unknown> => {
  return useQuery<JobOutput>(
    ['job', jobStatus?.job_id, 'result'],
    async () => {
      const baseURL = pluginURL.split('/').slice(0, -1).join('/'); // url with out rf function name
      const response = await fetch(baseURL + `/${jobStatus.job_id}/result`);

      const data: JobOutput = await response.json();
      return data;
    },
    {
      enabled: false,
      cacheTime: 0,
    }
  );
};
