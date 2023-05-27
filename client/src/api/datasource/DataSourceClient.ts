export interface DataSourceClient {
  list(): Promise<any>;
  get(dataSource: string): Promise<any>;
  get_meta(dataSource: string, filePath: string): Promise<any>;
  get_datasource_meta(dataSource: string): Promise<any>;
  update_meta(dataSource: string, filePath: string, meta: object): Promise<any>;
  features(): object;
}

export const CLIENT_TYPE_API = 'api';
export const CLIENT_TYPE_LOCAL = 'local';
export const CLIENT_TYPE_BLOB = 'azure_blob';
