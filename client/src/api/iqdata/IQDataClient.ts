import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { IQDataSlice } from '@/api/Models';

export interface IQDataClient {
  getIQDataSlice(meta: SigMFMetadata, index: number, tileSize: number): Promise<IQDataSlice>;
  getIQDataSlices(meta: SigMFMetadata, indexes: number[], tileSize: number): Promise<IQDataSlice[]>;
}
