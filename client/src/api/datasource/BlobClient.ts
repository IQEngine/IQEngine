import { DataSourceClient } from './DataSourceClient';
import { DataSource } from '@/api/Models';
import { getDataSourceFromDatasources } from '@/api/utils/AzureBlob';

export class BlobClient implements DataSourceClient {
  dataSources: Record<string, DataSource>;

  constructor(dataSources: Record<string, DataSource>) {
    this.dataSources = dataSources;
  }

  list(): Promise<DataSource[]> {
    if (!this.dataSources) {
      return Promise.reject('No data sources found');
    }
    return Promise.resolve(Object.values(this.dataSources));
  }

  get(account: string, container: string): Promise<DataSource> {
    const dataSource = getDataSourceFromDatasources(this.dataSources, account, container);
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
