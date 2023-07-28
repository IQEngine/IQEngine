import { DataSource } from '@/api/Models';

export interface DataSourceClient {
  list(): Promise<DataSource[]>;
  get(account: string, container: string): Promise<DataSource>;
  create(dataSource: DataSource): Promise<DataSource>;
  sync(account: string, container: string): Promise<void>;
  features(): { updateMeta: boolean; sync: boolean };
}
