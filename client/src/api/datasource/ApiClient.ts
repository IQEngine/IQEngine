import axios from 'axios';
import { DataSourceClient } from './DataSourceClient';
import { DataSource } from '../Models';
import { SigMFMetadata } from '@/Utils/sigmfMetadata';

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
    const response = await axios.get(`/api/datasources/${account}/${container}`);
    if (response.status !== 200) {
      throw new Error(`Unexpected status code: ${response.status}`);
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
