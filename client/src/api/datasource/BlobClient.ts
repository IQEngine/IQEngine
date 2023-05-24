import { DataSourceClient } from './DataSourceClient';

export class BlobClient implements DataSourceClient {
  get_datasource_meta(dataSource: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  update_meta(dataSource: string, filePath: string, meta: object): Promise<any> {
    throw new Error('Method not implemented.');
  }
  list(): Promise<any> {
    throw new Error('Not implemented');
  }
  get(dataSource: string): Promise<any> {
    throw new Error('Not implemented');
  }
  get_meta(dataSource: string, filePath: string): Promise<any> {
    throw new Error('Not implemented');
  }
  features() {
    return {
      update_meta: false,
    };
  }
}
