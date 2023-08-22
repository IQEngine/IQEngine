import { SigMFMetadata, TraceabilityOrigin } from '@/utils/sigmfMetadata';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';
import { IQDataClient } from './IQDataClient';
import { IQDataSlice } from '@/api/Models';
import { convertToFloat32 } from '@/utils/fetch-more-data-source';
import { MINIMAP_FFT_SIZE } from '@/utils/constants';

export class LocalClient implements IQDataClient {
  files: FileWithDirectoryAndFileHandle[];

  constructor(files: FileWithDirectoryAndFileHandle[]) {
    this.files = files;
  }
  async getMinimapIQ(meta: SigMFMetadata, signal: AbortSignal): Promise<Float32Array[]> {
    const localDirectory: FileWithDirectoryAndFileHandle[] = this.files;
    if (!localDirectory) {
      return Promise.reject('No local directory found');
    }
    const skipNFfts = Math.floor(meta.getTotalSamples() / (1000 * MINIMAP_FFT_SIZE)); // sets the decimation rate (manually tweaked)
    const numFfts = Math.floor(meta.getTotalSamples() / MINIMAP_FFT_SIZE / (skipNFfts + 1));
    let dataRange = [];
    for (let i = 0; i < numFfts; i++) {
      dataRange.push(i * skipNFfts);
    }
    const { file_path } = meta.getOrigin();
    const dataFile = localDirectory.find((file) => {
      return file.webkitRelativePath === file_path + '.sigmf-data' || file.name === file_path + '.sigmf-data';
    });
    if (!dataFile) {
      return Promise.reject('No data file found');
    }
    const result: Float32Array[] = [];
    for (const index of dataRange) {
      const bytesPerSample = meta.getBytesPerIQSample();
      const offsetBytes = index * MINIMAP_FFT_SIZE * bytesPerSample;
      const countBytes = MINIMAP_FFT_SIZE * bytesPerSample;
      const slice = dataFile.slice(offsetBytes, offsetBytes + countBytes);
      const buffer = await slice.arrayBuffer();
      const iqArray = convertToFloat32(buffer, meta.getDataType());
      result.push(iqArray);
    }
    return result;
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
