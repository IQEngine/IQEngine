import axios from 'axios';
import { MetadataClient } from './MetadataClient';
import { SigMFMetadata } from '@/Utils/sigmfMetadata';

export class ApiClient implements MetadataClient {
  async getMeta(account: string, container: string, filePath: string): Promise<SigMFMetadata> {
    const response = await axios.get(`/api/datasources/${account}/${container}/${filePath}`);
    return response.data;
  }
  async getDataSourceMeta(account: string, container: string): Promise<SigMFMetadata[]> {
    const response = await axios.get(`/api/datasources/${account}/${container}/meta`);
    return response.data;
  }
  async updateMeta(account: string, container: string, filePath: string, meta: SigMFMetadata): Promise<SigMFMetadata> {
    const response = await axios.put(`/api/datasources/${account}/${container}/${filePath}`, meta);
    return response.data;
  }
}
