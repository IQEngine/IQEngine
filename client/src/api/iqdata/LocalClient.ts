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
  getIQDataSlices(
    meta: SigMFMetadata,
    indexes: number[],
    tileSize: number,
    signal: AbortSignal
  ): Promise<IQDataSlice[]> {
    return Promise.all(indexes.map((index) => this.getIQDataSlice(meta, index, tileSize, signal)));
  }

  async getIQDataSlice(
    meta: SigMFMetadata,
    index: number,
    tileSize: number,
    signal: AbortSignal
  ): Promise<IQDataSlice> {
    const localDirectory: FileWithDirectoryAndFileHandle[] = this.files;
    if (!localDirectory) {
      Promise.reject('No local directory found');
    }
    const filePath = meta.getOrigin().file_path;
    const dataFile = localDirectory.find((file) => {
      return file.webkitRelativePath === filePath + '.sigmf-data' || file.name === filePath + '.sigmf-data';
    });
    if (!dataFile) {
      return Promise.reject('No data file found');
    }
    const bytesPerIQSample = meta.getBytesPerIQSample();
    const offsetBytes = index * tileSize * bytesPerIQSample;
    const countBytes = tileSize * bytesPerIQSample;
    const slice = dataFile.slice(offsetBytes, offsetBytes + countBytes);
    const buffer = await slice.arrayBuffer();
    const iqArray = convertToFloat32(buffer, meta.getDataType());
    return { index, iqArray };
  }
}
