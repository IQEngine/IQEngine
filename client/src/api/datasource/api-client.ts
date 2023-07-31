import axios from 'axios';
import { DataSourceClient } from './datasource-client';
import { DataSource } from '@/api/Models';
import { TraceabilityOrigin } from '@/utils/sigmfMetadata';

export class ApiClient implements DataSourceClient {
  async sync(account: string, container: string): Promise<void> {
    await axios.put(`/api/datasources/${account}/${container}/sync`);
  }
  async query(queryString: string, signal: AbortSignal): Promise<TraceabilityOrigin[]> {
    const response = await axios.get(`/api/datasources/query?${queryString}`, { signal });
    return response.data.map((item, i) => {
      item = Object.assign(new TraceabilityOrigin(), item);
      return item;
    });
  }
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
      updateMeta: true,
      sync: true,
      query: true,
    };
  }
}
