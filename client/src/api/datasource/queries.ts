import { DataSourceClientFactory } from './datasource-client-factory';
import { DataSourceClient } from './datasource-client';
import { DataSource } from '@/api/Models';
import { TraceabilityOrigin } from '@/utils/sigmfMetadata';
import { useUserSettings } from '@/api/user-settings/use-user-settings';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMsal } from '@azure/msal-react';
import { ClientType } from '@/api/Models';

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
  const { instance } = useMsal();
  const client = DataSourceClientFactory(type, filesQuery.data, dataSourcesQuery.data, instance);
  return useQuery(['datasource', type], () => fetchDataSources(client), {
    enabled: enabled,
  });
};

export const getDataSource = (type: string, account: string, container: string, enabled = true) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const { instance } = useMsal();
  const client = DataSourceClientFactory(type, filesQuery.data, dataSourcesQuery.data,instance);
  return useQuery(
    ['datasource', type, account, container],
    () => {

      return fetchDataSource(client, account, container);
    },
    {
      enabled: enabled,
    }
  );
};

export const useQueryMeta = (type: string, queryString: string, enabled = true) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const { instance } = useMsal();
  const client = DataSourceClientFactory(type, filesQuery.data, dataSourcesQuery.data, instance);
  return useQuery<TraceabilityOrigin[]>(
    ['metadata-query', queryString],
    async ({ signal }) => {
      return await client.query(queryString, signal);
    },
    {
      enabled: enabled,
    }
  );
};

export const useGetDatasourceFeatures = (type: string) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const { instance } = useMsal();
  const client = DataSourceClientFactory(type, filesQuery.data, dataSourcesQuery.data, instance);
  return client.features();
};

export const useSyncDataSource = (type: string, account: string, container) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const { instance } = useMsal();
  const client = DataSourceClientFactory(type, filesQuery.data, dataSourcesQuery.data, instance);
  return () => client.sync(account, container);
};

export const useAddDataSource = () => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const { instance } = useMsal();
  const dataSourceClient = DataSourceClientFactory(ClientType.API, filesQuery.data, dataSourcesQuery.data, instance);

  return useMutation({
    mutationFn: (dataSource: DataSource) => {
      let response = dataSourceClient.create(dataSource);
      return response;
    },
    onError: (err, newMeta, context) => {
      console.error('onError', err);
    },
  });
};
