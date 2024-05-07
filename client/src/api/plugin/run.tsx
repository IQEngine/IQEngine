import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { JobResult, JobStatus, RunPluginBody } from '../Models';

export const useRunPlugin = (
  pluginURL: string,
  runPluginBody: RunPluginBody | null
): UseQueryResult<JobStatus, unknown> => {
  return useQuery<JobStatus>(
    ['plugin', pluginURL, 'run', runPluginBody],
    async () => {
      console.log(runPluginBody);

      let formData = new FormData();

      for (var i = 0; i < runPluginBody.iq_files.length; i++) {
        formData.append('iq_files', runPluginBody.iq_files[i]);
      }

      for (var i = 0; i < runPluginBody.metadata_files.length; i++) {
        console.log(JSON.stringify(runPluginBody.metadata_files[i]));
        formData.append('metadata_files', JSON.stringify(runPluginBody.metadata_files[i]));
      }

      formData.append('custom_params', JSON.stringify(runPluginBody.custom_params));

      const response = await fetch(pluginURL, {
        method: 'POST',
        body: formData,
      });

      return response.json();
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

export const useGetJobResult = (pluginURL: string, jobStatus: JobStatus): UseQueryResult<JobResult, unknown> => {
  return useQuery<JobResult>(
    ['job', jobStatus?.job_id, 'result'],
    async () => {
      console.log('jobStatus', jobStatus);
      const baseURL = pluginURL.split('/').slice(0, -1).join('/'); // url with out rf function name
      const response = await fetch(baseURL + `/${jobStatus.job_id}/result`);

      return JSON.parse(await response.json());
    },
    {
      retry: 3,
      enabled: jobStatus?.job_id != null && jobStatus?.progress === 100 && jobStatus?.error === null,
      cacheTime: 0,
    }
  );
};
