import { DataSourceClient, DataSource } from './DataSourceClient';
import { SigMFMetadata } from '@/Utils/sigmfStructure';

export class LocalClient implements DataSourceClient {
  get_datasource_meta(dataSource: string): Promise<SigMFMetadata> {
    throw new Error('Method not implemented.');
  }
  update_meta(dataSource: string, filePath: string, meta: object): Promise<SigMFMetadata> {
    throw new Error('Method not implemented.');
  }
  list(): Promise<DataSource[]> {
    throw new Error('Not implemented');
  }
  get(dataSource: string): Promise<DataSource> {
    throw new Error('Not implemented');
  }
  get_meta(dataSource: string, filePath: string): Promise<SigMFMetadata> {
    throw new Error('Not implemented');
  }
  features() {
    return {
      update_meta: false,
    };
  }
}
