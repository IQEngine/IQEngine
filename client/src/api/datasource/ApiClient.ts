import axios from 'axios';
import { DataSourceClient } from './DataSourceClient';
import { DataSource } from '../Models';
import { SigMFMetadata } from '@/Utils/sigmfMetadata';

export class ApiClient implements DataSourceClient {
  async list(): Promise<DataSource[]> {
    const response = await axios.get('/api/datasources');
    return response.data;
  }
  async get(account: string, container: string): Promise<DataSource> {
    const response = await axios.get(`/api/datasources/${account}/${container}`);
    return response.data;
  }
  features() {
    return {
      save_files: true,
    };
  }
}
