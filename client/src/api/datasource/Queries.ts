import { useQuery } from '@tanstack/react-query';
import { DataSourceClientFactory } from './DataSourceClientFactory';

const fetchDataSources = async (type: string) => {
  const client = DataSourceClientFactory(type);
  const response = await client.list();
  return response;
};

const fetchDataSource = async (type: string, account: string, container: string) => {
  const client = DataSourceClientFactory(type);
  const response = await client.get(account, container);
  return response;
};

export const getDataSources = (type: string, enabled = true) =>
  useQuery(['datasource', type], () => fetchDataSources(type), {
    enabled: enabled,
  });

export const getDataSource = (type: string, account: string, container: string, enabled = true) =>
  useQuery(['datasource', type, account, container], () => fetchDataSource(type, account, container), {
    enabled: enabled,
  });

export const getFeatures = (type: string) => {
  const client = DataSourceClientFactory(type);
  return client.features();
};
