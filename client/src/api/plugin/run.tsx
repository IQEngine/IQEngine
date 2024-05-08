import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { JobOutput, JobStatus, RunPluginBody } from '../Models';

export const useRunPlugin = (
  pluginURL: string,
  runPluginBody: RunPluginBody | null
): UseQueryResult<JobStatus, unknown> => {
  return useQuery<JobStatus>(
    ['plugin', pluginURL, 'run', runPluginBody.custom_params, runPluginBody.metadata_file, runPluginBody.iq_file],
    async () => {
      let formData = new FormData();
      formData.append('iq_file', runPluginBody.iq_file);
      formData.append('metadata_file', JSON.stringify(runPluginBody.metadata_file));
      formData.append('custom_params', JSON.stringify(runPluginBody.custom_params));
      const response = await fetch(pluginURL, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      return data;
    },
    {
      enabled: false,
      cacheTime: 0,
      staleTime: 0,
    }
  );
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
