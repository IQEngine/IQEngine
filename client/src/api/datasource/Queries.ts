import { useQuery } from '@tanstack/react-query';
import { DataSourceClientFactory } from './DataSourceClientFactory';
import { DataSourceClient } from './DataSourceClient';
import { useUserSettings } from '@/api/user-settings/use-user-settings';

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

const fetchDataSource = async (client: DataSourceClient, account: string, container: string) => {
  const response = await client.get(account, container);
  return response;
};

export const getDataSources = (type: string, enabled = true) => {
  const { filesQuery, dataSourcesQuery } = useUserSettings();
  const client = DataSourceClientFactory(type, filesQuery.data, dataSourcesQuery.data);
  return useQuery(['datasource', type], () => fetchDataSources(client), {
    enabled: enabled,
  });
};

export const getDataSource = (type: string, account: string, container: string, enabled = true) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  return useQuery(
    ['datasource', type, account, container],
    () => {
      const client = DataSourceClientFactory(type, filesQuery.data, dataSourcesQuery.data);
      return fetchDataSource(client, account, container);
    },
    {
      enabled: enabled,
    }
  );
};

export const getFeatures = (type: string) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const client = DataSourceClientFactory(type, filesQuery.data, dataSourcesQuery.data);
  return client.features();
};
