import { useUserSettings } from '@/api/user-settings/use-user-settings';
import { ClientType, DataSource } from '@/api/Models';
import { DataSourceClientFactory } from '@/api/datasource/datasource-client-factory';
import { useQuery } from '@tanstack/react-query';
import { DataSourceClient } from '@/api/datasource/datasource-client';
import { useMsal } from '@azure/msal-react';

const fetchDataSources = async (client: DataSourceClient) => {
  let response;
  try {
    response = await client.list();
  } catch (error) {
    console.error('the failed GET above is due to no connection to the backend API');
    response = [];
  }
  return response;
};

export function useGetDatasources() {
  const { filesQuery, dataSourcesQuery } = useUserSettings();
  const enabled = filesQuery.isSuccess && dataSourcesQuery.isSuccess;
  const { instance } = useMsal();
  const apiClient = DataSourceClientFactory(ClientType.API, filesQuery.data, dataSourcesQuery.data, instance);
  const localClient = DataSourceClientFactory(ClientType.LOCAL, filesQuery.data, dataSourcesQuery.data, instance);
  const blobClient = DataSourceClientFactory(ClientType.BLOB, filesQuery.data, dataSourcesQuery.data, instance);
  const apiQuery = useQuery<DataSource[]>(['datasource', ClientType.API], () => fetchDataSources(apiClient), {
    enabled: enabled,
  });
  const localQuery = useQuery<DataSource[]>(['datasource', ClientType.LOCAL], () => fetchDataSources(localClient), {
    enabled: enabled,
  });
  const blobQuery = useQuery<DataSource[]>(['datasource', ClientType.BLOB], () => fetchDataSources(blobClient), {
    enabled: enabled,
  });
  return { apiQuery, localQuery, blobQuery };
}
