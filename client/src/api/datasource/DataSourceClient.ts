export interface DataSourceClient {
  list(): Promise<DataSource[]>;
  get(dataSource: string): Promise<DataSource>;
  get_meta(dataSource: string, filePath: string): Promise<JSONObject>;
  get_datasource_meta(dataSource: string): Promise<JSONObject>;
  update_meta(dataSource: string, filePath: string, meta: object): Promise<any>;
  features(): object;
}


export interface DataSource {
   name: String
   type: String
   meta: JSONObject
   path: String;
}

type JSONValue =
    | string
    | number
    | boolean
    | JSONObject
    | JSONArray;

export interface JSONObject {
    [x: string]: JSONValue;
}

interface JSONArray extends Array<JSONValue> { }

export const CLIENT_TYPE_API = 'api';
export const CLIENT_TYPE_LOCAL = 'local';
export const CLIENT_TYPE_BLOB = 'azure_blob';
