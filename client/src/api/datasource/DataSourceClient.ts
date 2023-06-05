import { SigMFMetadata } from '@/Utils/sigmfMetadata';
import { DataSource } from '../Models';

export interface DataSourceClient {
  list(): Promise<DataSource[]>;
  get(account: string, container: string): Promise<DataSource>;
  features(): object;
}
