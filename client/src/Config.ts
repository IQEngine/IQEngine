import axios from 'axios';

export class Config {
  detectorEndpoint: string;
  connectionInfo: object;
  googleAnalyticsKey: string;
  static Instance: Config;
  static async Initialize(): Promise<Config> {
    const config = new Config();
    config.detectorEndpoint = import.meta.env.VITE_DETECTOR_ENDPOINT;
    config.connectionInfo = JSON.parse(import.meta.env.VITE_CONNECTION_INFO);
    config.googleAnalyticsKey = import.meta.env.VITE_GOOGLE_ANALYTICS_KEY;
    await axios('/api/config')
      .then((response) => {
        if (response.status === 200) {
          if (response.data.detectorEndpoint) {
            config.detectorEndpoint = response.data.detectorEndpoint;
          }
          if (response.data.connectionInfo) {
            config.connectionInfo = response.data.connectionInfo;
          }
          if (response.data.googleAnalyticsKey) {
            config.googleAnalyticsKey = response.data.googleAnalyticsKey;
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
    this.Instance = config;
    return config;
  }
}

export const GetConfigIntance = async () => {
  return Config.Instance ?? (await Config.Initialize());
};
