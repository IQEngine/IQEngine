import { IQDataClient } from './IQDataClient';
import { convertToFloat32 } from '@/utils/FetchMoreDataSource';
import { getBlobClient } from '@/api/utils/AzureBlob';
import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { DataSource, IQDataSlice } from '@/api/Models';

export class BlobClient implements IQDataClient {
  dataSources: Record<string, DataSource>;

  constructor(dataSources: Record<string, DataSource>) {
    this.dataSources = dataSources;
  }

  getIQDataSlices(meta: SigMFMetadata, indexes: number[], tileSize: number): Promise<IQDataSlice[]> {
    return Promise.all(indexes.map((index) => this.getIQDataSlice(meta, index, tileSize)));
  }

  async getIQDataSlice(meta: SigMFMetadata, index: number, tileSize: number): Promise<IQDataSlice> {
    let { account, container, file_path } = meta.getOrigin();
    // if filePath does not finish in .sigmf-data, add it
    if (!file_path.endsWith('.sigmf-data')) {
      file_path += '.sigmf-data';
    }
    let startTime = performance.now();
    const bytesPerSample = meta.getBytesPerSample();
    const offsetBytes = index * tileSize * bytesPerSample * 2;
    const countBytes = tileSize * bytesPerSample * 2;
    const blobClient = getBlobClient(this.dataSources, account, container, file_path);
    // Thi is ugly but it is the only way to get the blob as an ArrayBuffer
    const download = await blobClient.download(offsetBytes, countBytes);
    const blobBody = await (await download.blobBody).arrayBuffer();
    const iqArray = convertToFloat32(blobBody, meta.getDataType());
    console.debug(`getIQDataSlice ${file_path} ${index} took:`, performance.now() - startTime, 'ms');
    return { index, iqArray };
  }
}
