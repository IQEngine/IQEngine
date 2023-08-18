import { DataSourceClientFactory } from './datasource-client-factory';
import { DataSourceClient } from './datasource-client';
import { DataSource } from '@/api/Models';
import { TraceabilityOrigin } from '@/utils/sigmfMetadata';
import { useUserSettings } from '@/api/user-settings/use-user-settings';
import { useMutation, useQuery } from '@tanstack/react-query';
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

export const fetchDataSource = async (client: DataSourceClient, account: string, container: string) => {
  const response = await client.get(account, container);
  return response;
};

const fetchSasToken = async (client: DataSourceClient, account: string, container: string, filepath: string) => {
  const response = await client.getSasToken(account, container, filepath);
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
  const client = DataSourceClientFactory(type, filesQuery.data, dataSourcesQuery.data);
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

export const useSasToken = (type: string, account: string, container: string, filepath: string, enabled = true) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const client = DataSourceClientFactory(type, filesQuery.data, dataSourcesQuery.data);

  return useQuery(
    ['sas', type, account, container, filepath],
    () => {
      return fetchSasToken(client, account, container, filepath);
    },
    {
      enabled: enabled,
    }
  );
};

export const useQueryMeta = (type: string, queryString: string, enabled = true) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  return useQuery<TraceabilityOrigin[]>(
    ['metadata-query', queryString],
    async ({ signal }) => {
      const client = DataSourceClientFactory(type, filesQuery.data, dataSourcesQuery.data);
      return await client.query(queryString, signal);
    },
    {
      enabled: enabled,
    }
  );
};

export const useGetDatasourceFeatures = (type: string) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const client = DataSourceClientFactory(type, filesQuery.data, dataSourcesQuery.data);
  return client.features();
};

export const useSyncDataSource = (type: string, account: string, container) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const client = DataSourceClientFactory(type, filesQuery.data, dataSourcesQuery.data);
  return () => client.sync(account, container);
};

export const useAddDataSource = () => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const dataSourceClient = DataSourceClientFactory(ClientType.API, filesQuery.data, dataSourcesQuery.data);

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
