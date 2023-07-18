import { DataSourceClientFactory } from './datasource-client-factory';
import { DataSourceClient } from './datasource-client';
import { DataSource } from '@/api/Models';
import { useUserSettings } from '@/api/user-settings/use-user-settings';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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



export const useAddDataSource = (dataSource: DataSource) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const dataSourceClient = DataSourceClientFactory(ClientType.API, filesQuery.data, dataSourcesQuery.data);
  let client = useQueryClient();

  return useMutation({
    mutationFn: (dataSource: DataSource) => {
      return dataSourceClient.create(dataSource);
    }
    // onMutate: async (dataSource: DataSource) => {
    //   await client.cancelQueries(['config']);
    //   const previousConfig = client.getQueryData(['config']);
    //   client.setQueryData(['config'], config);
    //   return { previousConfig };
    // },
    // onError: (err, newMeta, context) => {
    //   console.error('onError', err);
    //   client.setQueryData(['config'], context.previousConfig);
    // },
  });
};
