import axios from 'axios';
import { DataSource, DataSourceClient, JSONObject } from './DataSourceClient';

export class ApiClient implements DataSourceClient {
  list(): Promise<DataSource[]> {
    return axios.get('/api/datasources');
  }
  get(dataSource: string): Promise<DataSource> {
    return axios.get(`/api/datasources/${dataSource}`);
  }
  get_meta(dataSource: string, filePath: string): Promise<JSONObject> {
    return axios.get(`/api/datasources/${dataSource}/${filePath}/meta`);
  }
  get_datasource_meta(dataSource: string): Promise<JSONObject> {
    return axios.get(`/api/datasources/${dataSource}/meta`);
  }
  update_meta(dataSource: string, filePath: string, meta: object): Promise<JSONObject> {
    return axios.put(`/api/datasources/${dataSource}/${filePath}/meta`, meta);
  }
  features() {
    return {
      save_files: true,
    };
  }
}
