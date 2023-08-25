import axios from 'axios';
import { IQDataClient } from './IQDataClient';
import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { IQDataSlice } from '@/api/Models';
import { convertToFloat32 } from '@/utils/fetch-more-data-source';
import { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import { AuthUtil } from '@/api/utils/Auth-Utils';


export class ApiClient implements IQDataClient {
  private authUtil: AuthUtil;

  constructor(instance: IPublicClientApplication, account: AccountInfo) {
    this.authUtil = new AuthUtil(instance, account);
  }
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
    const binaryResponse = await this.authUtil.requestWithAuthIfRequired({
      method: 'get',
      url: dataUrl,
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

  async getMinimapIQ(meta: SigMFMetadata, signal: AbortSignal): Promise<Float32Array[]> {
    const { account, container, file_path } = meta.getOrigin();
    const format = meta.getDataType();
    const dataUrl = `/api/datasources/${account}/${container}/${file_path}/minimap-data`;
    const binaryResponse = await this.authUtil.requestWithAuthIfRequired({
      method: 'get',
      url: dataUrl,
      responseType: 'arraybuffer',
      signal: signal,
      params: {
        format: format,
      },
    });
    if (binaryResponse.status !== 200) {
      throw new Error(`Unexpected status code: ${binaryResponse.status}`);
    }
    if (!binaryResponse.data) {
      return null;
    }
    const iqArray = convertToFloat32(binaryResponse.data, meta.getDataType());
    // slice in 64 samples chunks
    const iqArrayChunks: Float32Array[] = [];
    for (let i = 0; i < iqArray.length; i += 64) {
      iqArrayChunks.push(iqArray.slice(i, i + 64));
    }
    return iqArrayChunks;
  }
}
