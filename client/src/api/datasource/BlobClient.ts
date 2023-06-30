import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { DataSourceClient } from './DataSourceClient';
import { DataSource } from '@/api/Models';
import store from '@/store/store';
import { getDataSourceFromConnection } from '@/api/utils/AzureBlob';

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

  create(dataSource: DataSource): Promise<DataSource> {
    return Promise.reject('Not implemented');
  }

  features() {
    return {
      update_meta: false,
    };
  }
}
