import { SigMFMetadata, TraceabilityOrigin, Track } from '@/utils/sigmfMetadata';
import { SmartQueryResult } from '../Models';

export interface MetadataClient {
  getMeta(account: string, container: string, filePath: string): Promise<SigMFMetadata>;
  getDataSourceMetaPaths(account: string, container: string): Promise<string[]>;
  track(account: string, container: string, filepath: string, signal: AbortSignal): Promise<number[][]>;
  updateMeta(account: string, container: string, filePath: string, meta: SigMFMetadata): Promise<any>;
  features(): { canUpdateMeta: boolean };
  smartQuery(queryString: string, signal: AbortSignal): Promise<SmartQueryResult>;
}
