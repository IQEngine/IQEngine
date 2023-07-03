import axios from 'axios';
import { IQDataClient } from './IQDataClient';
import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { IQDataSlice } from '@/api/Models';
import { convertToFloat32 } from '@/utils/FetchMoreDataSource';

export class ApiClient implements IQDataClient {
  async getIQDataSlices(meta: SigMFMetadata, indexes: number[], tileSize: number): Promise<IQDataSlice[]> {
    //return Promise.all(indexes.map((index) => this.getIQDataSlice(meta, index, tileSize)));
    let { account, container, file_path } = meta.getOrigin();

    let startTime = performance.now();
    const bytesPerSample = meta.getBytesPerSample();
    const body = {
      indexes: indexes,
      tile_size: tileSize,
      bytes_per_sample: bytesPerSample,
    };

    const queryURL = `/api/datasources/${account}/${container}/${file_path}/iqslices`;

    const response = await axios.post(queryURL, body);
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

  async getIQDataSlice(meta: SigMFMetadata, index: number, tileSize: number): Promise<IQDataSlice> {
    let { account, container, file_path } = meta.getOrigin();

    let startTime = performance.now();
    const bytesPerSample = meta.getBytesPerSample();
    const offsetBytes = index * tileSize * bytesPerSample * 2;
    const countBytes = tileSize * bytesPerSample * 2;
    const queryURL = `/api/datasources/${account}/${container}/${file_path}/iqslice?offsetBytes=${offsetBytes}&countBytes=${countBytes}`;
    const response = await axios.get(queryURL);
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
