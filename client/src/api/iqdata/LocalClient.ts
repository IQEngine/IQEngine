import { SigMFMetadata, TraceabilityOrigin } from '@/utils/sigmfMetadata';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';
import { IQDataClient } from './IQDataClient';
import { IQDataSlice } from '@/api/Models';
import { convertToFloat32 } from '@/utils/FetchMoreDataSource';

export class LocalClient implements IQDataClient {
  files: FileWithDirectoryAndFileHandle[];

  constructor(files: FileWithDirectoryAndFileHandle[]) {
    this.files = files;
  }
  getIQDataSlices(meta: SigMFMetadata, indexes: number[], tileSize: number): Promise<IQDataSlice[]> {
    return Promise.all(indexes.map((index) => this.getIQDataSlice(meta, index, tileSize)));
  }

  async getIQDataSlice(meta: SigMFMetadata, index: number, tileSize: number): Promise<IQDataSlice> {
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
    const bytesPerSample = meta.getBytesPerSample();
    const offsetBytes = index * tileSize * bytesPerSample * 2;
    const countBytes = tileSize * bytesPerSample * 2;
    const slice = dataFile.slice(offsetBytes, offsetBytes + countBytes);
    const buffer = await slice.arrayBuffer();
    const iqArray = convertToFloat32(buffer, meta.getDataType());
    return { index, iqArray };
  }
}
