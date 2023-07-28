import { SigMFMetadata } from '@/utils/sigmfMetadata';

export interface MetadataClient {
  getMeta(account: string, container: string, filePath: string): Promise<SigMFMetadata>;
  getDataSourceMetaPaths(account: string, container: string): Promise<string[]>;
  updateMeta(account: string, container: string, filePath: string, meta: SigMFMetadata): Promise<any>;
  features(): { canUpdateMeta: boolean };
}
