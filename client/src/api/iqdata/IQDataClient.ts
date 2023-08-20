import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { IQDataSlice } from '@/api/Models';

export interface IQDataClient {
  getIQDataBlocks(
    meta: SigMFMetadata,
    indexes: number[],
    blockSize: number,
    signal: AbortSignal
  ): Promise<IQDataSlice[]>;
}
