import axios from 'axios';
import { DataSourceClient } from './DataSourceClient';
import { DataSource } from '@/api/Models';

export class ApiClient implements DataSourceClient {
  async list(): Promise<DataSource[]> {
    const response = await axios.get('/api/datasources');
    if (response.status !== 200) {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
    if (!response.data) {
      return null;
    }
    return response.data;
  }
  async get(account: string, container: string): Promise<DataSource> {
    const response = await axios.get(`/api/datasources/${account}/${container}/datasource`);
    if (response.status !== 200) {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
    if (!response.data) {
      return null;
    }
    return response.data;
  }
  async create(dataSource: DataSource): Promise<DataSource> {
    const response = await axios.post('/api/datasources', dataSource);
    if (response.status !== 201) {
      throw new Error(`Failed to create datasource: ${response.status}`);
    }
    if (!response.data) {
      return null;
    }
    return response.data;
  }
  features() {
    return {
      save_files: true,
    };
  }
}
