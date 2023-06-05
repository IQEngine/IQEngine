import { SigMFMetadata } from '@/Utils/sigmfMetadata';
import { IQDataSlice } from '../Models';

export interface IQDataClient {
  getIQDataSlice(meta: SigMFMetadata, index: number, tileSize: number): Promise<IQDataSlice>;
  getIQDataSlices(meta: SigMFMetadata, indexes: number[], tileSize: number): Promise<IQDataSlice[]>;
}
