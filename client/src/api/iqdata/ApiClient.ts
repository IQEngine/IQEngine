import axios from 'axios';
import { IQDataClient } from './IQDataClient';
import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { IQDataSlice } from '@/api/Models';
import { convertToFloat32 } from '@/utils/fetch-more-data-source';

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
    //console.log('getIQDataBlocks response', binaryResponse.data);
    const intValue = new Int32Array(binaryResponse.data.slice(0, 4));
    //console.log(`getIQDataBlocks ${binaryResponse.data}`, intValue);
    // convert to float32
    const iqArray = convertToFloat32(binaryResponse.data, format);

    const result = indexes.map((index, i) => {
      return {
        index,
        iqArray: iqArray.slice(i * blockSize * 2, (i + 1) * blockSize * 2),
      };
    });
    //console.log('getIQDataBlocks', result);
    return result;
  }
}
