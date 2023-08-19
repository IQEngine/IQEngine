import { SigMFMetadata, Track } from '@/utils/sigmfMetadata';
import { MetadataClientFactory } from './metadata-client-factory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MetadataClient } from './metadata-client';
import { useUserSettings } from '@/api/user-settings/use-user-settings';
import { useMsal } from '@azure/msal-react';

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

export const useQueryDataSourceMetaPaths = (type: string, account: string, container: string, enabled = true) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const { instance } = useMsal();
  if (!dataSourcesQuery.data || !filesQuery.data) {
    return useQuery(['invalidQuery'], () => null);
  }
  const metadataClient = MetadataClientFactory(type, filesQuery.data, dataSourcesQuery.data, instance);
  return useQuery(
    ['datasource', type, account, container, 'meta', 'paths'],
    () => {

      return metadataClient.getDataSourceMetaPaths(account, container);
    },
    {
      enabled: enabled,
      staleTime: Infinity,
    }
  );
};

export const useQueryTrack = (type: string, account: string, container: string, filepath: string, enabled = true) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const { instance } = useMsal();
  const client = MetadataClientFactory(type, filesQuery.data, dataSourcesQuery.data, instance);
  return useQuery<Track>(
    ['track', account, container, filepath],
    async ({ signal }) => {
      return await client.track(account, container, filepath, signal);
    },
    {
      enabled: enabled,
    }
  );
};

export const getMeta = (type: string, account: string, container: string, filePath: string, enabled = true) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  if (!dataSourcesQuery.data || !filesQuery.data) {
    return useQuery(['invalidQuery'], () => null);
  }
  const { instance } = useMsal();
  const metadataClient = MetadataClientFactory(type, filesQuery.data, dataSourcesQuery.data, instance);
  return useQuery(
    ['datasource', type, account, container, filePath, 'meta'],
    () => {
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
  if (!meta.getOrigin()) {
    throw new Error('Meta is missing origin');
  }
  const { type, account, container, file_path: filePath } = meta.getOrigin();
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const { instance } = useMsal();
  const metadataClient = MetadataClientFactory(type, filesQuery.data, dataSourcesQuery.data, instance);

  return useMutation({
    mutationFn: (newMeta: SigMFMetadata) => {
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
  const { instance } = useMsal();
  const metadataClient = MetadataClientFactory(type, filesQuery.data, dataSourcesQuery.data, instance);
  return metadataClient.features();
};

export const useMeta = (type: string, account: string, container: string, filePath: string) => {
  const { filesQuery, dataSourcesQuery } = useUserSettings();
  const { instance } = useMsal();
  const metadataClient = MetadataClientFactory(type, filesQuery.data, dataSourcesQuery.data, instance);
  return useQuery<SigMFMetadata>({
    queryKey: ['datasource', type, account, container, filePath, 'meta'],
    queryFn: () => {
      return metadataClient.getMeta(account, container, filePath);
    },
    enabled: !!filesQuery.data && !!dataSourcesQuery.data,
  });
};
