import { SigMFMetadata } from "@/Utils/sigmfStructure";

export interface DataSourceClient {
  list(): Promise<DataSource[]>;
  get(dataSource: string): Promise<DataSource>;
  get_meta(dataSource: string, filePath: string): Promise<SigMFMetadata>;
  get_datasource_meta(dataSource: string): Promise<SigMFMetadata>;
  update_meta(dataSource: string, filePath: string, meta: object): Promise<SigMFMetadata>;
  features(): object;
}

export interface DataSource {
  name: String
  type: String
  meta: object
  path: String;
}

export const CLIENT_TYPE_API = 'api';
export const CLIENT_TYPE_LOCAL = 'local';
export const CLIENT_TYPE_BLOB = 'azure_blob';
