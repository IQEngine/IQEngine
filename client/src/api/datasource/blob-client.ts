import { DataSourceClient } from './datasource-client';
import { DataSource } from '@/api/Models';
import { getDataSourceFromDatasources } from '@/api/utils/AzureBlob';
import { TraceabilityOrigin } from '@/utils/sigmfMetadata';

export class BlobClient implements DataSourceClient {
  dataSources: Record<string, DataSource>;

  constructor(dataSources: Record<string, DataSource>) {
    this.dataSources = dataSources;
  }
  sync(account: string, container: string): Promise<void> {
    throw new Error('sync not supported for blob data sources');
  }

  query(querystring: string, signal: AbortSignal): Promise<TraceabilityOrigin[]> {
    throw new Error('query not supported for blob data sources');
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
      updateMeta: false,
      sync: false,
      query: false,
    };
  }
}
