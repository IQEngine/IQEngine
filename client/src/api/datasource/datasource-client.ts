import { DataSource } from '@/api/Models';
import { TraceabilityOrigin, Track } from '@/utils/sigmfMetadata';

export interface DataSourceClient {
  list(): Promise<DataSource[]>;
  get(account: string, container: string): Promise<DataSource>;
  query(queryString: string, signal: AbortSignal): Promise<TraceabilityOrigin[]>;
  create(dataSource: DataSource): Promise<DataSource>;
  sync(account: string, container: string): Promise<void>;
  track(account: string, container: string, filepath: string): Promise<Track>;
  features(): { updateMeta: boolean; sync: boolean; query: boolean };
}
