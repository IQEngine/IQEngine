import { DataSourceClient, DataSource, JSONObject } from './DataSourceClient';

export class BlobClient implements DataSourceClient {
  get_datasource_meta(dataSource: string): Promise<JSONObject> {
    throw new Error('Method not implemented.');
  }
  update_meta(dataSource: string, filePath: string, meta: object): Promise<JSONObject> {
    throw new Error('Method not implemented.');
  }
  list(): Promise<DataSource[]> {
    throw new Error('Not implemented');
  }
  get(dataSource: string): Promise<DataSource> {
    throw new Error('Not implemented');
  }
  get_meta(dataSource: string, filePath: string): Promise<JSONObject> {
    throw new Error('Not implemented');
  }
  features() {
    return {
      update_meta: false,
    };
  }
}
