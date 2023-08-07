import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { IQDataSlice } from '@/api/Models';
import { getIQDataSlices } from './Queries';

export interface IQDataClient {
  getIQDataBlocks(
    meta: SigMFMetadata,
    indexes: number[],
    blockSize: number,
    signal: AbortSignal
  ): Promise<IQDataSlice[]>;
}
