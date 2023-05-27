import axios from 'axios';
import { DataSourceClient } from './DataSourceClient';

export class ApiClient implements DataSourceClient {
  list() {
    return axios.get('/api/datasources');
  }
  get(dataSource: string) {
    return axios.get(`/api/datasources/${dataSource}`);
  }
  get_meta(dataSource: string, filePath: string) {
    return axios.get(`/api/datasources/${dataSource}/${filePath}/meta`);
  }
  get_datasource_meta(dataSource: string): Promise<any> {
    return axios.get(`/api/datasources/${dataSource}/meta`);
  }
  update_meta(dataSource: string, filePath: string, meta: object) {
    return axios.put(`/api/datasources/${dataSource}/${filePath}/meta`, meta);
  }
  features() {
    return {
      save_files: true,
    };
  }
}
