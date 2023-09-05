import axios from 'axios';
import { DataSourceClient } from './datasource-client';
import { DataSource } from '@/api/Models';
import { TraceabilityOrigin } from '@/utils/sigmfMetadata';
import { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import { AuthUtil } from '@/api/utils/Auth-Utils';

export class ApiClient implements DataSourceClient {
  private authUtil: AuthUtil;

  constructor(instance: IPublicClientApplication, account: AccountInfo) {
    this.authUtil = new AuthUtil(instance, account);
  }

  async sync(account: string, container: string): Promise<void> {
    await this.authUtil.requestWithAuthIfRequired({
      method: 'put',
      url: `/api/datasources/${account}/${container}/sync`,
    });
  }
  async query(queryString: string, signal: AbortSignal): Promise<TraceabilityOrigin[]> {
    const response = await this.authUtil.requestWithAuthIfRequired({
      method: 'get',
      url: `/api/datasources/query?${queryString}`,
      signal,
    });
    return response.data.map((item, i) => {
      item = Object.assign(new TraceabilityOrigin(), item);
      return item;
    });
  }
  async list(): Promise<DataSource[]> {
    const response = await this.authUtil.requestWithAuthIfRequired({
      method: 'get',
      url: '/api/datasources',
    });
    if (response.status !== 200) {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
    if (!response.data) {
      return null;
    }
    return response.data;
  }
  async get(account: string, container: string): Promise<DataSource> {
    const response = await this.authUtil.requestWithAuthIfRequired({
      method: 'get',
      url: `/api/datasources/${account}/${container}/datasource`,
    });
    if (response.status !== 200) {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
    if (!response.data) {
      return null;
    }
    return response.data;
  }
  async getSasToken(account: string, container: string, filepath: string, write: boolean): Promise<Object> {
    try {
      const response = await this.authUtil.requestWithAuthIfRequired({
        method: 'get',
        url: `/api/datasources/${account}/${container}/${filepath}/sas?write=${write}`,
      });
      if (!response.data) {
        return null;
      }

      return response

    } catch (error) {
      const status = error.response.status
      if (status !== 200) {
        throw new Error(`Unexpected status code: ${status}`);
      }
    }

  }
  async update(dataSource: DataSource): Promise<DataSource> {
    const response = await this.authUtil.requestWithAuthIfRequired({
      method: 'put',
      url: `/api/datasources/${dataSource.account}/${dataSource.container}/datasource`,
      data: dataSource,
    });
    if (response.status !== 204) {
      throw new Error(`Failed to update datasource: ${response.status}`);
    }
    return response.data;
  }
  async create(dataSource: DataSource): Promise<DataSource> {
    const response = await this.authUtil.requestWithAuthIfRequired({
      method: 'post',
      url: '/api/datasources',
      data: dataSource,
    });
    if (response.status !== 201) {
      throw new Error(`Failed to create datasource: ${response.status}`);
    }
    if (!response.data) {
      return null;
    }
    return response.data;
  }
  features() {
    return {
      updateMeta: true,
      sync: true,
      query: true,
    };
  }
}
