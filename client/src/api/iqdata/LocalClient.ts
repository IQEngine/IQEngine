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

    const localDirectory: FileWithDirectoryAndFileHandle[] = this.files;
    if (!localDirectory) {
      return Promise.reject('No local directory found');
    }

    const filePath = meta.getOrigin().file_path;
    const dataFile = localDirectory.find((file) => {
      return file.webkitRelativePath === filePath + '.sigmf-data' || file.name === filePath + '.sigmf-data';
    });
    if (!dataFile) {
      return Promise.reject('No data file found');
    }

    return Promise.all(indexes.map(async (index) => {
      const bytesPerIQSample = meta.getBytesPerIQSample();
      const countBytes = blockSize * bytesPerIQSample;
      const offsetBytes = index * countBytes;
      const slice = dataFile.slice(offsetBytes, offsetBytes + countBytes);
      const buffer = await slice.arrayBuffer();
      const iqArray = convertToFloat32(buffer, meta.getDataType());
      return { index, iqArray };
    }));
  }
}
