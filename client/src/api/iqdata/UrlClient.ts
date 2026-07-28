import { IQDataClient } from './IQDataClient';
import { convertToFloat32 } from '@/utils/fetch-more-data-source';
import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { IQDataSlice } from '@/api/Models';
import { groupContiguousIndexes } from '@/utils/group';
import { MINIMAP_FFT_SIZE } from '@/utils/constants';
import { fetchIQRange, urlRecordingLocation } from '@/utils/url-datasource';

// Reads IQ out of a .sigmf-data served over plain HTTP, using range requests
// for the same reason the blob client uses ranged downloads: only the visible
// part of a recording is ever fetched.
export class UrlClient implements IQDataClient {
  private dataUrl(meta: SigMFMetadata): string {
    const { account, container } = meta.getOrigin();
    return urlRecordingLocation(account, container).dataUrl;
  }

  async getMinimapIQ(meta: SigMFMetadata, signal: AbortSignal): Promise<Float32Array[]> {
    const dataUrl = this.dataUrl(meta);
    const bytesPerIQSample = meta.getBytesPerIQSample();
    // Same decimation as the blob client: enough ffts to draw the minimap, no
    // more, because each one is its own request.
    const skipNFfts = Math.floor(meta.getTotalSamples() / (1000 * MINIMAP_FFT_SIZE));
    const numFfts = Math.floor(meta.getTotalSamples() / MINIMAP_FFT_SIZE / (skipNFfts + 1));
    const iqBlocks: Float32Array[] = [];
    for (let i = 0; i < numFfts; i++) {
      const offsetBytes = i * skipNFfts * MINIMAP_FFT_SIZE * bytesPerIQSample;
      const countBytes = MINIMAP_FFT_SIZE * bytesPerIQSample;
      const buffer = await fetchIQRange(dataUrl, offsetBytes, countBytes, bytesPerIQSample, signal);
      iqBlocks.push(convertToFloat32(buffer, meta.getDataType()));
    }
    return iqBlocks;
  }

  async getIQDataBlocks(
    meta: SigMFMetadata,
    indexes: number[],
    blockSize: number,
    signal: AbortSignal
  ): Promise<IQDataSlice[]> {
    const dataUrl = this.dataUrl(meta);
    const contiguousIndexes = groupContiguousIndexes(indexes);
    const content = await Promise.all(
      contiguousIndexes.map((indexGroup) =>
        this.getIQDataBlockFromUrl(dataUrl, meta, indexGroup.start, indexGroup.count, blockSize, signal)
      )
    );
    return content.flat();
  }

  async getIQDataBlockFromUrl(
    dataUrl: string,
    meta: SigMFMetadata,
    index: number,
    count: number,
    blockSize: number,
    signal: AbortSignal
  ): Promise<IQDataSlice[]> {
    const bytesPerIQSample = meta.getBytesPerIQSample();
    const offsetBytes = index * blockSize * bytesPerIQSample;
    const countBytes = blockSize * count * bytesPerIQSample;
    const buffer = await fetchIQRange(dataUrl, offsetBytes, countBytes, bytesPerIQSample, signal);
    const iqArray = convertToFloat32(buffer, meta.getDataType());
    const iqBlocks: IQDataSlice[] = [];
    for (let i = 0; i < count; i++) {
      const offset = i * blockSize * 2;
      iqBlocks.push({ index: index + i, iqArray: iqArray.slice(offset, offset + blockSize * 2) });
    }
    return iqBlocks;
  }
}
