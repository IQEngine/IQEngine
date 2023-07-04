import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { MetadataClientFactory } from './MetadataClientFactory';
import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MetadataClient } from './MetadataClient';
import { useUserSettings } from '@/api/user-settings/use-user-settings';

export const fetchMeta = async (
  client: MetadataClient,
  type: string,
  account: string,
  container: string,
  filePath: string
) => {
  const response = await client.getMeta(account, container, filePath);
  return response;
};

const fetchDataSourceMeta = async (
  client: MetadataClient,
  queryClient: QueryClient,
  type: string,
  account: string,
  container: string
) => {
  const response = await client.getDataSourceMeta(account, container);
  for (const meta of response) {
    queryClient.setQueryData(['datasource', type, account, container, meta.getOrigin().file_path, 'meta'], meta);
  }
  return response;
};

const updateDataSourceMeta = async (
  client: MetadataClient,
  account: string,
  container: string,
  filePath: string,
  meta: SigMFMetadata
) => {
  const response = await client.updateMeta(account, container, filePath, meta);
  return response;
};

export const getDataSourceMeta = (
  client: QueryClient,
  type: string,
  account: string,
  container: string,
  enabled = true
) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  if (!dataSourcesQuery.data || !filesQuery.data) {
    return useQuery(['invalidQuery'], () => null);
  }
  return useQuery(
    ['datasource', type, account, container, 'meta'],
    () => {
      const metadataClient = MetadataClientFactory(type, filesQuery.data, dataSourcesQuery.data);
      return fetchDataSourceMeta(metadataClient, client, type, account, container);
    },
    {
      enabled: enabled,
      staleTime: Infinity,
    }
  );
};

export const getMeta = (type: string, account: string, container: string, filePath: string, enabled = true) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  if (!dataSourcesQuery.data || !filesQuery.data) {
    return useQuery(['invalidQuery'], () => null);
  }
  return useQuery(
    [
      'datasource',
      type,
      account,
      container,
      filePath,
      'meta'
    ],
    () => {
      const metadataClient = MetadataClientFactory(type, filesQuery.data, dataSourcesQuery.data);
      return fetchMeta(metadataClient, type, account, container, filePath);
    },
    {
      enabled: enabled && !!dataSourcesQuery.data && !!filesQuery.data,
      staleTime: Infinity,
    }
  );
};

export const useUpdateMeta = (meta: SigMFMetadata) => {
  let client = useQueryClient();
  console.log('updateMeta', meta);
  if (!meta.getOrigin()) {
    throw new Error('Meta is missing origin');
  }
  const { type, account, container, file_path: filePath } = meta.getOrigin();
  const { dataSourcesQuery, filesQuery } = useUserSettings();

  return useMutation({
    mutationFn: (newMeta: SigMFMetadata) => {
      const metadataClient = MetadataClientFactory(type, filesQuery.data, dataSourcesQuery.data);
      return updateDataSourceMeta(metadataClient, account, container, filePath, newMeta);
    },
    onMutate: async () => {
      await client.cancelQueries(['datasource', type, account, container, filePath, 'meta']);
      const previousMeta = client.getQueryData(['datasource', type, account, container, filePath, 'meta']);
      client.setQueryData(['datasource', type, account, container, filePath, 'meta'], meta);
      return { previousMeta };
    },
    onError: (err, newMeta, context) => {
      console.error('onError', err);
      client.setQueryData(['datasource', type, account, container, filePath, 'meta'], context.previousMeta);
    },
  });
};

export const useGetMetadataFeatures = (type: string) => {
  const { filesQuery, dataSourcesQuery } = useUserSettings();
  const metadataClient = MetadataClientFactory(type, filesQuery.data, dataSourcesQuery.data);
  return metadataClient.features();
};
