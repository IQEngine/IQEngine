import { SigMFMetadata } from '@/Utils/sigmfMetadata';
import { MetadataClientFactory } from './MetadataClientFactory';
import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const fetchMeta = async (type: string, account: string, container: string, filePath: string) => {
  const client = MetadataClientFactory(type);
  const response = await client.getMeta(account, container, filePath);
  return response;
};

const fetchDataSourceMeta = async (quertClient: QueryClient, type: string, account: string, container: string) => {
  const client = MetadataClientFactory(type);
  const response = await client.getDataSourceMeta(account, container);
  for (const meta of response) {
    quertClient.setQueryData(['datasource', type, account, container, meta.getOrigin().file_path, 'meta'], meta);
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
    }
  );

export const getMeta = (type: string, account: string, container: string, filePath: string, enabled = true) =>
  useQuery(['datasource', type, account, container, filePath, 'meta'], () =>
    fetchMeta(type, account, container, filePath)
  );

export const updateMeta = (client: QueryClient, meta: SigMFMetadata) => {
  if (!meta.getOrigin()) {
    throw new Error('Meta is missing origin');
  }
  const { type, account, container, file_path: filePath } = meta.getOrigin();
  useMutation({
    mutationFn: () => updateDataSourceMeta(type, account, container, filePath, meta),
    onMutate: async () => {
      await client.cancelQueries(['datasource', type, account, container, filePath, 'meta']);
      const previousMeta = client.getQueryData(['datasource', type, account, container, filePath, 'meta']);
      client.setQueryData(['datasource', type, account, container, filePath, 'meta'], meta);
      return { previousMeta };
    },
    onError: (err, newTodo, context) => {
      client.setQueryData(['datasource', type, account, container, filePath, 'meta'], context.previousMeta);
    },
  });
};

export const preFetchDataSourcesMeta = (client: QueryClient, type: string, account: string, container: string) => {
  client.prefetchQuery(['datasource', type, account, container, 'meta'], () =>
    fetchDataSourceMeta(client, type, account, container)
  );
};
