import { DataSource } from '@/api/Models';
import { TraceabilityOrigin } from '@/utils/sigmfMetadata';

export interface DataSourceClient {
  list(): Promise<DataSource[]>;
  get(account: string, container: string): Promise<DataSource>;
  getSasToken(account: string, container: string, filepath: string, write: boolean): Promise<Object>;
  query(queryString: string, signal: AbortSignal): Promise<TraceabilityOrigin[]>;
  create(dataSource: DataSource): Promise<DataSource>;
  update(dataSource: DataSource): Promise<DataSource>;
  sync(account: string, container: string): Promise<void>;
  syncAll(): Promise<void>;
  features(): { updateMeta: boolean; sync: boolean; query: boolean };
}
