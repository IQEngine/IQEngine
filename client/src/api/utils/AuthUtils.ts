import { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import axios from "axios";

export class AuthUtil {
    private instance: IPublicClientApplication;
    private account: AccountInfo;

    constructor(instance: IPublicClientApplication, account: AccountInfo) {
      this.instance = instance;
      this.account = account;
    }

    async getAccessToken() {
      const api_scope = 'api://' + import.meta.env.IQENGINE_APP_ID + '/api';
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

    async requestWithAuthIfRequired(config) {
      const token = await this.getAccessToken();
      if (token != null) {
        const headers = {
          Authorization: `Bearer ${token}`,
        };
        return axios({ ...config, headers });
      }
      return axios({ ...config, headers: {} });
    }
  }
