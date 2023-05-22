import { ConfigApi } from './services/config';
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
    let serverConfig = await ConfigApi.GetConfig();
    if (serverConfig) {
      if (serverConfig.detectorEndpoint) {
        config.detectorEndpoint = serverConfig.detectorEndpoint;
      }
      if (serverConfig.connectionInfo) {
        config.connectionInfo = serverConfig.connectionInfo;
      }
      if (serverConfig.googleAnalyticsKey) {
        config.googleAnalyticsKey = serverConfig.googleAnalyticsKey;
      }
    }
    return config;
  }
}

export const GetConfigInstance = async () => {
  return Config.Instance ?? (await Config.Initialize());
};
