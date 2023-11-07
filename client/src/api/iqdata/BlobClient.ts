import { IQDataClient } from './IQDataClient';
import { convertToFloat32 } from '@/utils/fetch-more-data-source';
import { getBlobClient } from '@/api/utils/AzureBlob';
import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { DataSource, IQDataSlice } from '@/api/Models';
import { BlobClient as AzureBlobClient } from '@azure/storage-blob';
import { groupContiguousIndexes } from '@/utils/group';
import { MINIMAP_FFT_SIZE } from '@/utils/constants';

export class BlobClient implements IQDataClient {
  dataSources: Record<string, DataSource>;

  constructor(dataSources: Record<string, DataSource>) {
    this.dataSources = dataSources;
  }

  async getMinimapIQ(meta: SigMFMetadata, signal: AbortSignal): Promise<Float32Array[]> {
    // Changes in the spectrogram height require a recalculation of the ffts required
    // for minimap only. there's so much overhead with blob downloading that this might as well be a high value...
    const skipNFfts = Math.floor(meta.getTotalSamples() / (1000 * MINIMAP_FFT_SIZE)); // sets the decimation rate (manually tweaked)
    const numFfts = Math.floor(meta.getTotalSamples() / MINIMAP_FFT_SIZE / (skipNFfts + 1));
    let dataRange = [];
    for (let i = 0; i < numFfts; i++) {
      dataRange.push(i * skipNFfts);
    }
    let { account, container, file_path } = meta.getOrigin();
    // if filePath does not finish in .sigmf-data, add it
    if (!file_path.endsWith('.sigmf-data')) {
      file_path += '.sigmf-data';
    }
    const blobClient = getBlobClient(this.dataSources, account, container, file_path);
    const iqBlocks: Float32Array[] = [];
    for (const index of dataRange) {
      const bytesPerSample = meta.getBytesPerIQSample();
      const offsetBytes = index * MINIMAP_FFT_SIZE * bytesPerSample;
      const countBytes = MINIMAP_FFT_SIZE * bytesPerSample;
      // This is ugly but it is the only way to get the blob as an ArrayBuffer
      const download = await blobClient.download(offsetBytes, countBytes, {
        abortSignal: signal,
      });
      const blobBody = await (await download.blobBody).arrayBuffer();
      const iqArray = convertToFloat32(blobBody, meta.getDataType());
      iqBlocks.push(iqArray);
    }
    return iqBlocks;
  }

  async getIQDataBlocks(
    meta: SigMFMetadata,
    indexes: number[],
    blockSize: number,
    signal: AbortSignal
  ): Promise<IQDataSlice[]> {
    console.debug('getIQDataBlocks', indexes);
    const contiguousIndexes = groupContiguousIndexes(indexes);
    let { account, container, file_path } = meta.getOrigin();
    // if filePath does not finish in .sigmf-data, add it
    if (!file_path.endsWith('.sigmf-data')) {
      file_path += '.sigmf-data';
    }
    const content = await Promise.all(
      contiguousIndexes.map((indexGroup) =>
        this.getIQDataBlockFromBlob(
          getBlobClient(this.dataSources, account, container, file_path),
          meta,
          indexGroup.start,
          indexGroup.count,
          blockSize,
          signal
        )
      )
    );
    return content.flat();
  }

  async getIQDataBlockFromBlob(
    blobClient: AzureBlobClient,
    meta: SigMFMetadata,
    index: number,
    count: number,
    blockSize: number,
    signal: AbortSignal
  ): Promise<IQDataSlice[]> {
    const bytesPerSample = meta.getBytesPerIQSample();
    const offsetBytes = index * blockSize * bytesPerSample;
    const countBytes = blockSize * count * bytesPerSample;
    // This is ugly but it is the only way to get the blob as an ArrayBuffer
    const download = await blobClient.download(offsetBytes, countBytes, {
      abortSignal: signal,
    });
    const blobBody = await (await download.blobBody).arrayBuffer();
    const iqArray = convertToFloat32(blobBody, meta.getDataType());
    const iqBlocks: IQDataSlice[] = [];
    for (let i = 0; i < count; i++) {
      const offset = i * blockSize * 2;
      const iqBlock = iqArray.slice(offset, offset + blockSize * 2);
      iqBlocks.push({ index: index + i, iqArray: iqBlock });
    }
    return iqBlocks;
  }
}
