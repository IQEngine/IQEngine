import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { IQDataSlice } from '@/api/Models';
import { getIQDataSlices } from './Queries';

export interface IQDataClient {
  getIQDataSlice(meta: SigMFMetadata, index: number, tileSize: number): Promise<IQDataSlice>;
  getIQDataSlices(meta: SigMFMetadata, indexes: number[], tileSize: number): Promise<IQDataSlice[]>;
  getIQDataBlocks(meta: SigMFMetadata, indexes: number[], blockSize: number): Promise<IQDataSlice[]>;
}
