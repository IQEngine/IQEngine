import axios from 'axios';

interface ConfigSettings {
  detectorEndpoint?: string;
  connectionInfo?: object;
  googleAnalyticsKey?: string;
}

export class ConfigApi {
  static async GetConfig(): Promise<ConfigSettings> {
    return axios('/api/config')
      .then((response) => {
        if (response.status === 200) {
          return response.data;
        } else {
          return {};
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
}
