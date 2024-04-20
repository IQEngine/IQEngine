import { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import axios, { AxiosRequestConfig, CancelToken } from 'axios';
import { AppConfig } from '@/api/config/queries';

export class AuthUtil {
  private instance: IPublicClientApplication;
  private account: AccountInfo;
  private config: AppConfig;

  constructor(instance: IPublicClientApplication, account: AccountInfo, config: AppConfig) {
    this.instance = instance;
    this.account = account;
    this.config = config;
  }

  async getAccessToken() {
    const api_scope = 'api://' + this.config?.appId + '/api';
    if (!this.account) return null;
    try {
      const response = await this.instance.acquireTokenSilent({
        account: this.account,
        scopes: [api_scope],
      });
      return response.accessToken;
    } catch (error) {
      return null;
    }
  }

  async requestWithAuthIfRequired(config: AxiosRequestConfig) {
    const token = await this.getAccessToken();
    const authorizationHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    return axios({
      ...config,
      headers: {
        ...config.headers,
        ...authorizationHeaders,
      },
    });
  }
}
