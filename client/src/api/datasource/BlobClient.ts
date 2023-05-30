import { DataSourceClient, DataSource } from './DataSourceClient';

export class BlobClient implements DataSourceClient {
  get_datasource_meta(dataSource: string): Promise<object> {
    throw new Error('Method not implemented.');
  }
  update_meta(dataSource: string, filePath: string, meta: object): Promise<object> {
    throw new Error('Method not implemented.');
  }
  list(): Promise<DataSource[]> {
    throw new Error('Not implemented');
  }
  get(dataSource: string): Promise<DataSource> {
    throw new Error('Not implemented');
  }
  get_meta(dataSource: string, filePath: string): Promise<object> {
    throw new Error('Not implemented');
  }
  features() {
    return {
      update_meta: false,
    };
  }
}
