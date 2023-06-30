import { SigMFMetadata } from '@/utils/sigmfMetadata';

export interface MetadataClient {
  getMeta(account: string, container: string, filePath: string): Promise<SigMFMetadata>;
  getDataSourceMeta(account: string, container: string): Promise<SigMFMetadata[]>;
  updateMeta(account: string, container: string, filePath: string, meta: SigMFMetadata): Promise<any>;
  features(): { canUpdateMeta: boolean };
}
