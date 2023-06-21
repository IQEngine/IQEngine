import { SigMFMetadata } from '@/Utils/sigmfMetadata';
import { MetadataClientFactory } from './MetadataClientFactory';
import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const fetchMeta = async (type: string, account: string, container: string, filePath: string) => {
  const client = MetadataClientFactory(type);
  const response = await client.getMeta(account, container, filePath);
  return response;
};

const fetchDataSourceMeta = async (queryClient: QueryClient, type: string, account: string, container: string) => {
  const client = MetadataClientFactory(type);
  const response = await client.getDataSourceMeta(account, container);
  for (const meta of response) {
    queryClient.setQueryData(['datasource', type, account, container, meta.getOrigin().file_path, 'meta'], meta);
  }
  return response;
};

const updateDataSourceMeta = async (
  type: string,
  account: string,
  container: string,
  filePath: string,
  meta: SigMFMetadata
) => {
  const client = MetadataClientFactory(type);
  const response = await client.updateMeta(account, container, filePath, meta);
  return response;
};

export const getDataSourceMeta = (
  client: QueryClient,
  type: string,
  account: string,
  container: string,
  enabled = true
) =>
  useQuery(
    ['datasource', type, account, container, 'meta'],
    () => fetchDataSourceMeta(client, type, account, container),
    {
      enabled: enabled,
      staleTime: Infinity,
    }
  );

export const getMeta = (type: string, account: string, container: string, filePath: string, enabled = true) =>
  useQuery(
    ['datasource', type, account, container, filePath, 'meta'],
    () => fetchMeta(type, account, container, filePath),
    {
      enabled: enabled,
      staleTime: Infinity,
    }
  );

export const useUpdateMeta = (meta: SigMFMetadata) => {
  let client = useQueryClient();
  console.log('updateMeta', meta);
  if (!meta.getOrigin()) {
    throw new Error('Meta is missing origin');
  }
  const { type, account, container, file_path: filePath } = meta.getOrigin();
  return useMutation({
    mutationFn: (newMeta: SigMFMetadata) => updateDataSourceMeta(type, account, container, filePath, newMeta),
    onMutate: async () => {
      console.log('onMutate');
      await client.cancelQueries(['datasource', type, account, container, filePath, 'meta']);
      const previousMeta = client.getQueryData(['datasource', type, account, container, filePath, 'meta']);
      client.setQueryData(['datasource', type, account, container, filePath, 'meta'], meta);
      return { previousMeta };
    },
    onError: (err, newMeta, context) => {
      console.log('onError', err);
      client.setQueryData(['datasource', type, account, container, filePath, 'meta'], context.previousMeta);
    },
  });
};

export const preFetchDataSourcesMeta = (client: QueryClient, type: string, account: string, container: string) => {
  client.prefetchQuery(['datasource', type, account, container, 'meta'], () =>
    fetchDataSourceMeta(client, type, account, container)
  );
};

export const useGetMetadataFeatures = (type: string) => {
  const client = MetadataClientFactory(type);
  return client.features();
};
