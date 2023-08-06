import { SigMFMetadata, TraceabilityOrigin } from '@/utils/sigmfMetadata';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';
import { IQDataClient } from './IQDataClient';
import { IQDataSlice } from '@/api/Models';
import { convertToFloat32 } from '@/utils/fetch-more-data-source';

export class LocalClient implements IQDataClient {
  files: FileWithDirectoryAndFileHandle[];

  constructor(files: FileWithDirectoryAndFileHandle[]) {
    this.files = files;
  }
  getIQDataBlocks(
    meta: SigMFMetadata,
    indexes: number[],
    blockSize: number,
    signal: AbortSignal
  ): Promise<IQDataSlice[]> {
    throw new Error('Method not implemented.');
  }
}
