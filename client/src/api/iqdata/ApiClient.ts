import axios from 'axios';
import { IQDataClient } from './IQDataClient';
import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { IQDataSlice } from '@/api/Models';
import { convertToFloat32 } from '@/utils/FetchMoreDataSource';

export class ApiClient implements IQDataClient {
  async getIQDataBlocks(
    meta: SigMFMetadata,
    indexes: number[],
    blockSize: number,
    signal: AbortSignal
  ): Promise<IQDataSlice[]> {
    if (!meta || indexes.length === 0) {
      return [];
    }
    const { account, container, file_path } = meta.getOrigin();
    const format = meta.getDataType();

    const dataUrl = `/api/datasources/${account}/${container}/${file_path}/iq-data`;
    const queryParams = {
      block_indexes_str: indexes.join(','),
      block_size: blockSize,
      format: format,
    };
    const binaryResponse = await axios.get(dataUrl, {
      responseType: 'arraybuffer',
      params: queryParams,
      signal: signal,
    });

    if (binaryResponse.status !== 200) {
      throw new Error(`Unexpected status code: ${binaryResponse.status}`);
    }
    if (!binaryResponse.data) {
      return null;
    }
    console.log('getIQDataBlocks response', binaryResponse.data);
    const intValue = new Int32Array(binaryResponse.data.slice(0, 4));
    console.log(`getIQDataBlocks ${binaryResponse.data}`, intValue);
    // convert to float32
    const iqArray = convertToFloat32(binaryResponse.data, format);

    const result = indexes.map((index, i) => {
      return {
        index,
        iqArray: iqArray.slice(i * blockSize * 2, (i + 1) * blockSize * 2),
      };
    });
    console.log('getIQDataBlocks', result);
    return result;
  }
  async getIQDataSlices(
    meta: SigMFMetadata,
    indexes: number[],
    tileSize: number,
    signal: AbortSignal
  ): Promise<IQDataSlice[]> {
    let { account, container, file_path } = meta.getOrigin();

    let startTime = performance.now();
    const bytesPerIQSample = meta.getBytesPerIQSample();
    const body = {
      indexes: indexes,
      tile_size: tileSize,
      bytes_per_iq_sample: bytesPerIQSample,
    };

    const queryURL = `/api/datasources/${account}/${container}/${file_path}/iqslices`;

    const response = await axios.post(queryURL, body, {
      signal: signal,
    });
    if (response.status !== 200) {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
    if (!response.data) {
      return null;
    }

    return Promise.all(
      response.data.map((item) => {
        const byteCharacters = atob(item.data);
        const bytes = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          bytes[i] = byteCharacters.charCodeAt(i);
        }
        const iqArray = convertToFloat32(bytes.buffer, meta.getDataType());
        console.debug(`getIQDataSlice ${file_path} ${item.index} took:`, performance.now() - startTime, 'ms');
        let index = item.index;
        return { index, iqArray };
      })
    );
  }

  async getIQDataSlice(
    meta: SigMFMetadata,
    index: number,
    tileSize: number,
    signal: AbortSignal
  ): Promise<IQDataSlice> {
    let { account, container, file_path } = meta.getOrigin();

    let startTime = performance.now();
    const bytesPerIQSample = meta.getBytesPerIQSample();
    const offsetBytes = index * tileSize * bytesPerIQSample;
    const countBytes = tileSize * bytesPerIQSample;
    const queryURL = `/api/datasources/${account}/${container}/${file_path}/iqslice?offsetBytes=${offsetBytes}&countBytes=${countBytes}`;
    const response = await axios.get(queryURL, {
      signal: signal,
    });
    if (response.status !== 200) {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
    if (!response.data) {
      return null;
    }
    const byteCharacters = atob(response.data.data);
    const bytes = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      bytes[i] = byteCharacters.charCodeAt(i);
    }
    const iqArray = convertToFloat32(bytes.buffer, meta.getDataType());
    console.log(`getIQDataSlice ${file_path} ${index} took:`, performance.now() - startTime, 'ms');
    return { index, iqArray };
  }
}
