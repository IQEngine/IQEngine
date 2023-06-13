import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import store from '@/Store/store';
import { CLIENT_TYPE_BLOB, DataSource } from '@/api/Models';
import { upsertDataSource } from '@/Store/Reducers/ConnectionReducer';

const fetchConfig = async () => {
  try {
    const response = await axios.get<Config>('/api/config').catch((error) => {
      console.log('axios config not found, using env vars instead');
      return {
        data: {
          connectionInfo: JSON.parse(import.meta.env.VITE_CONNECTION_INFO),
          detectorEndpoint: import.meta.env.VITE_DETECTOR_ENDPOINT,
          googleAnalyticsKey: import.meta.env.VITE_GOOGLE_ANALYTICS_KEY,
          featureFlags: JSON.parse(import.meta.env.VITE_FEATURE_FLAGS),
        } as Config,
      };
    });
    if (!response.data.connectionInfo) {
      response.data.connectionInfo = JSON.parse(import.meta.env.VITE_CONNECTION_INFO);
    }
    if (!response.data.detectorEndpoint) {
      response.data.detectorEndpoint = import.meta.env.VITE_DETECTOR_ENDPOINT;
    }
    if (!response.data.googleAnalyticsKey) {
      response.data.googleAnalyticsKey = import.meta.env.VITE_GOOGLE_ANALYTICS_KEY;
    }
    if (!response.data.featureFlags) {
      response.data.featureFlags = JSON.parse(import.meta.env.VITE_FEATURE_FLAGS);
    }
    return response.data;
  } catch (error) {
    return {
      connectionInfo: JSON.parse(import.meta.env.VITE_CONNECTION_INFO),
      detectorEndpoint: import.meta.env.VITE_DETECTOR_ENDPOINT,
      googleAnalyticsKey: import.meta.env.VITE_GOOGLE_ANALYTICS_KEY,
      featureFlags: JSON.parse(import.meta.env.VITE_FEATURE_FLAGS),
    } as Config;
  }
};

interface ConnectionInfo {
  settings: Array<{
    name: string;
    containerName: string;
    accountName: string;
    sasToken: string;
    imageURL: string;
    description: string;
  }>;
}

type Config = {
  detectorEndpoint: string;
  connectionInfo: ConnectionInfo;
  googleAnalyticsKey: string;
  featureFlags: { [key: string]: boolean };
};

export const configQuery = () =>
  useQuery(['config'], fetchConfig, {
    onSuccess: (data) => {
      data.connectionInfo?.settings?.forEach((setting) => {
        const dataSource: DataSource = {
          type: CLIENT_TYPE_BLOB,
          name: setting.name,
          description: setting.description,
          imageURL: setting.imageURL,
          account: setting.accountName,
          container: setting.containerName,
          sasToken: setting.sasToken,
        };
        store.dispatch({ type: upsertDataSource.type, payload: dataSource });
      });
    },
  });
