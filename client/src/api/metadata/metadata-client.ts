import { SigMFMetadata, Track } from '@/utils/sigmfMetadata';

export interface MetadataClient {
  getMeta(account: string, container: string, filePath: string): Promise<SigMFMetadata>;
  getDataSourceMetaPaths(account: string, container: string): Promise<string[]>;
  track(account: string, container: string, filepath: string, signal: AbortSignal): Promise<Track>;
  updateMeta(account: string, container: string, filePath: string, meta: SigMFMetadata): Promise<any>;
  features(): { canUpdateMeta: boolean };
}
