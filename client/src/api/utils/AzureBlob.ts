import { BlobClient, BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { DataSource } from '@/api/Models';

import store from '@/store/store';

export function getDataSourceFromConnection(account: string, container: string): DataSource {
  const connection = store.getState().connection;
  if (!connection) {
    return undefined;
  }
  const dataSourceKey = `${account}/${container}`;
  const dataSource = connection.dataSources[dataSourceKey];
  if (!dataSource) {
    return undefined;
  }
  return dataSource;
}

export function getContainerClient(account: string, container: string): ContainerClient {
  const dataSource = getDataSourceFromConnection(account, container);
  if (!dataSource || !dataSource.sasToken) {
    throw new Error('No connection found');
  }
  const blobServiceClient = new BlobServiceClient(
    `https://${dataSource.account}.blob.core.windows.net?${dataSource.sasToken}`
  );
  return blobServiceClient.getContainerClient(dataSource.container);
}

export function getBlobClient(account: string, container: string, blobName: string): BlobClient {
  const containerClient = getContainerClient(account, container);
  return containerClient.getBlobClient(blobName);
}
