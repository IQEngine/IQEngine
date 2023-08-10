import axios from 'axios';
import { DataSourceClient } from './datasource-client';
import { DataSource } from '@/api/Models';
import { TraceabilityOrigin } from '@/utils/sigmfMetadata';
import { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';

export class ApiClient implements DataSourceClient {
  private instance: IPublicClientApplication;
  private account: AccountInfo;

  constructor(instance: IPublicClientApplication, account: AccountInfo) {
    this.instance = instance;
    this.account = account;
  }

  private async getAccessToken() {
    const api_scope = 'api://' + import.meta.env.IQENGINE_APP_ID + '/api';
    const response = await this.instance.acquireTokenSilent({
      account: this.account,
      scopes: [api_scope],
    });
    return response.accessToken; //accessToken or idToken
  }

  private async requestWithAuth(config) {
    const token = await this.getAccessToken();
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    return axios({ ...config, headers });
  }

  async sync(account: string, container: string): Promise<void> {
    await this.requestWithAuth({
      method: 'get',
      url: `/api/datasources/${account}/${container}/sync`,
    });
    //await axios.put(`/api/datasources/${account}/${container}/sync`);
  }
  async query(queryString: string, signal: AbortSignal): Promise<TraceabilityOrigin[]> {
    //const response = await axios.get(`/api/datasources/query?${queryString}`, { signal });
    const response = await this.requestWithAuth({
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
    const response = await this.requestWithAuth({
      method: 'get',
      url: '/api/datasources',
    });
    //const response = await axios.get('/api/datasources');
    if (response.status !== 200) {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
    if (!response.data) {
      return null;
    }
    return response.data;
  }
  async get(account: string, container: string): Promise<DataSource> {
    const response = await this.requestWithAuth({
      method: 'get',
      url: `/api/datasources/${account}/${container}/datasource`,
    });
    //const response = await axios.get(`/api/datasources/${account}/${container}/datasource`);
    if (response.status !== 200) {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
    if (!response.data) {
      return null;
    }
    return response.data;
  }
  async create(dataSource: DataSource): Promise<DataSource> {
    const response = await this.requestWithAuth({
      method: 'post',
      url: '/api/datasources',
      data: dataSource,
    });
    //const response = await axios.post('/api/datasources', dataSource);
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
