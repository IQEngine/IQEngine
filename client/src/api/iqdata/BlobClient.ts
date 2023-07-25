import { IQDataClient } from './IQDataClient';
import { convertToFloat32 } from '@/utils/FetchMoreDataSource';
import { getBlobClient } from '@/api/utils/AzureBlob';
import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { DataSource, IQDataSlice } from '@/api/Models';
import { BlobClient as AzureBlobClient } from '@azure/storage-blob';
import { groupContingousIndexes } from '@/utils/group';

export class BlobClient implements IQDataClient {
  dataSources: Record<string, DataSource>;

  constructor(dataSources: Record<string, DataSource>) {
    this.dataSources = dataSources;
  }
  async getIQDataBlocks(meta: SigMFMetadata, indexes: number[], blockSize: number): Promise<IQDataSlice[]> {
    const contingousIndexes = groupContingousIndexes(indexes);
    const content = await Promise.all(
      contingousIndexes.map((indexGroup) =>
        this.getIQDataBlockFromBlob(
          getBlobClient(
            this.dataSources,
            meta.getOrigin().account,
            meta.getOrigin().container,
            meta.getOrigin().file_path
          ),
          meta,
          indexGroup.start,
          indexGroup.count,
          blockSize
        )
      )
    );
    return content.flat();
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
    const blobClient = getBlobClient(this.dataSources, account, container, file_path);
    // Thi is ugly but it is the only way to get the blob as an ArrayBuffer
    return (await this.getIQDataBlockFromBlob(blobClient, meta, index, 1, tileSize))[0];
  }

  async getIQDataBlockFromBlob(
    blobClient: AzureBlobClient,
    meta: SigMFMetadata,
    index: number,
    count: number,
    blockSize: number
  ): Promise<IQDataSlice[]> {
    let startTime = performance.now();
    const bytesPerSample = meta.getBytesPerSample();
    const offsetBytes = index * blockSize * bytesPerSample * 2;
    const countBytes = blockSize * count * bytesPerSample * 2;
    // Thi is ugly but it is the only way to get the blob as an ArrayBuffer
    const download = await blobClient.download(offsetBytes, countBytes);
    const blobBody = await (await download.blobBody).arrayBuffer();
    const iqArray = convertToFloat32(blobBody, meta.getDataType());
    console.debug(`get blob block ${blobClient.name} ${index} ${count} took:`, performance.now() - startTime, 'ms');
    const iqBlocks: IQDataSlice[] = [];
    for (let i = 0; i < count; i++) {
      const offset = i * blockSize;
      const iqBlock = iqArray.slice(offset, offset + blockSize);
      iqBlocks.push({ index: index + i, iqArray: iqBlock });
    }
    return iqBlocks;
  }
}
