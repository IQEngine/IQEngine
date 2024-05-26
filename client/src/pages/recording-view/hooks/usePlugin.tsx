import { JobOutput } from '@/api/Models';
import { useRunPlugin, useGetJobStatus, useGetJobOutput } from '@/api/plugin/run';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * `PluginHookParams` is an interface that describes the shape of the parameter object for the `usePlugin` hook.
 * @interface
 * @property {string} pluginURL - The URL of the plugin.
 */
interface PluginHookParams {
  pluginURL: string;
  handleJobOutput?: (jobOutput: JobOutput) => void;
}

/**
 * `usePlugin` is a custom React hook that handles plugin logic.
 * It uses several other hooks to fetch and manage the state of a plugin.
 * @function
 * @param {PluginHookParams} { pluginURL } - The parameters for the hook.
 * @returns {Object} An object containing the state and functions related to the plugin.
 */
export const usePlugin = ({ pluginURL, handleJobOutput }: PluginHookParams) => {
  // react-query client
  const queryClient = useQueryClient();

  // get useRunPlugin Mutation and destructure it
  const runPluginMutation = useRunPlugin(pluginURL);
  const {
    data: initialJobStatus,
    isLoading: isRunPluginLoading,
    mutate: runPlugin,
    reset: resetRunPlugin,
  } = runPluginMutation;

  // get useGetJobStatus query and destructure it
  const jobStatusQuery = useGetJobStatus(pluginURL, initialJobStatus?.job_id);
  const { data: jobStatus, isFetching: isJobStatusFetching } = jobStatusQuery;

  // get useGetJobOutput query and destructure it
  const jobOutputQuery = useGetJobOutput(pluginURL, jobStatus);
  const { data: jobOutput, isFetching: isJobOutputFetching, refetch: fetchJobOutput } = jobOutputQuery;

  // Check if the plugin is running
  const pluginIsRunning = isRunPluginLoading || jobStatus?.progress < 100 || isJobStatusFetching || isJobOutputFetching;

  /**
   * `resetPluginQueries` is a function that resets the queries related to the plugin.
   * It resets the queries for the job result, job status, and plugin run.
   */
  const resetPluginQueries = () => {
    queryClient.resetQueries(['job', jobStatus?.job_id, 'result'], { exact: true });
    queryClient.resetQueries(['job', jobStatus?.job_id, 'status'], { exact: true });
    resetRunPlugin();
  };

  useEffect(() => {
    if (jobStatus?.progress === 100) {
      fetchJobOutput();
    }
  }, [jobStatus]);

  useEffect(() => {
    if (!jobOutput) return;

    handleJobOutput(jobOutput);
  }, [jobOutput]);

  return {
    jobStatus,
    jobOutput,
    pluginIsRunning,
    runPlugin,
    resetPluginQueries,
  };
};
