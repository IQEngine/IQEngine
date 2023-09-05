import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { IQDataSlice } from '@/api/Models';

// we have 3 different types of IQ clients, API, Blob, and Local.  They all use this interface

export interface IQDataClient {
  getIQDataBlocks(
    meta: SigMFMetadata,
    indexes: number[],
    blockSize: number,
    signal: AbortSignal
  ): Promise<IQDataSlice[]>;

  getMinimapIQ(meta: SigMFMetadata, signal: AbortSignal): Promise<Float32Array[]>;
}
