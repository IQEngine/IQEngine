import { SigMFMetadata } from '@/Utils/sigmfMetadata';
import { DataSourceClient } from './DataSourceClient';
import { DataSource } from '../Models';
import store from '@/Store/store';
import { getDataSourceFromConnection } from '../utils/AzureBlob';

export class BlobClient implements DataSourceClient {
  list(): Promise<DataSource[]> {
    const connection = store.getState().connection;
    if (!connection) {
      return Promise.reject('No connection found');
    }
    return Promise.resolve(Object.values(connection.dataSources));
  }

  get(account: string, container: string): Promise<DataSource> {
    const dataSource = getDataSourceFromConnection(account, container);
    if (!dataSource) {
      return Promise.reject('No connection found');
    }
    return Promise.resolve(dataSource);
  }

  features() {
    return {
      update_meta: false,
    };
  }
}
