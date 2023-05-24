import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataSourceClientFactory } from './DataSourceClientFactory';

const fetchMeta = async (type, dataSource, filePath) => {
  const client = DataSourceClientFactory(type);
  const response = await client.get_meta(dataSource, filePath);
  return response.data;
};

const fetchDataSources = async (type) => {
  const client = DataSourceClientFactory(type);
  const response = await client.list();
  return response;
};

const fetchDataSource = async (type, dataSourceID) => {
  const client = DataSourceClientFactory(type);
  const response = await client.get(dataSourceID);
  return response;
};

const fetchDataSourceMeta = async (type, dataSourceID) => {
  const client = DataSourceClientFactory(type);
  const response = await client.get_datasource_meta(dataSourceID);
  return response;
};

export const CLIENT_TYPE_API = 'api';
export const CLIENT_TYPE_LOCAL = 'local';
export const CLIENT_TYPE_BLOB = 'blob';

const updateDataSourceMeta = async (type, dataSourceID, filePath, meta) => {
  const client = DataSourceClientFactory(type);
  const response = await client.update_meta(dataSourceID, filePath, meta);
  return response;
};

export const getDataSources = (type) => useQuery(['datasource', type], (type) => fetchDataSources(type));
export const getDataSource = (type: string, dataSourceID: string) =>
  useQuery(['datasource', type, dataSourceID], () => fetchDataSource(type, dataSourceID));
export const getDataSourceMeta = (type: string, dataSourceID: string) =>
  useQuery(['datasource', type, dataSourceID, 'meta'], () => fetchDataSourceMeta(type, dataSourceID));
export const getMeta = (type: string, dataSourceID: string, filePath: string) =>
  useQuery(['datasource', type, dataSourceID, filePath, 'meta'], () => fetchMeta(type, dataSourceID, filePath));
export const updateMeta = (type: string, dataSourceID: string, filePath: string, meta: object) =>
  useMutation({
    mutationFn: () => updateDataSourceMeta(type, dataSourceID, filePath, meta),
    onSettled(data, error, variables, context) {
      let client = useQueryClient();
      client.invalidateQueries(['datasource', type, dataSourceID]);
    },
  });

export const getFeatures = (type: string) => {
  const client = DataSourceClientFactory(type);
  return client.features();
};
