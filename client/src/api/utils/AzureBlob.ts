import { BlobClient, BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { DataSource } from '@/api/Models';

export function getDataSourceFromDatasources(
  dataSources: Record<string, DataSource>,
  account: string,
  container: string
): DataSource {
  if (!dataSources) {
    throw new Error('No data sources found');
  }
  const dataSourceKey = `${account}/${container}`;
  const dataSource = dataSources[dataSourceKey];
  if (!dataSource) {
    return undefined;
  }
  return dataSource;
}

export function getContainerClient(
  dataSources: Record<string, DataSource>,
  account: string,
  container: string
): ContainerClient {
  const dataSource = getDataSourceFromDatasources(dataSources, account, container);
  if (!dataSource) {
    console.debug(`DATASOURCE NOT FOUND: ${account}/${container}`, dataSources);
    throw new Error('No connection found');
  }
  console.debug(`DATASOURCE FOUND: ${dataSource.account}/${dataSource.container} ${dataSource.sasToken}`);

  let blobServiceClient = undefined;
  if (dataSource.sasToken) {
    blobServiceClient = new BlobServiceClient(
      `https://${dataSource.account}.blob.core.windows.net?${dataSource.sasToken}`
    );
  } else {
    blobServiceClient = new BlobServiceClient(`https://${dataSource.account}.blob.core.windows.net`, undefined);
  }
  return blobServiceClient.getContainerClient(dataSource.container);
}

export function getBlobClient(
  dataSources: Record<string, DataSource>,
  account: string,
  container: string,
  blobName: string
): BlobClient {
  const containerClient = getContainerClient(dataSources, account, container);
  return containerClient.getBlobClient(blobName);
}
