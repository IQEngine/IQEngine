import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import store from '@/store/store';
import { CLIENT_TYPE_BLOB, DataSource } from '@/api/Models';
import { upsertDataSource } from '@/store/reducers/ConnectionReducer';
import { FeatureFlag } from '@/hooks/useFeatureFlags';

const fetchConfig = async () => {
  try {
    const response = await axios.get<Config>('/api/config').catch((error) => {
      console.log('axios config not found, using env vars instead');
      return {
        data: {
          connectionInfo: JSON.parse(import.meta.env.IQENGINE_CONNECTION_INFO ?? null),
          googleAnalyticsKey: import.meta.env.IQENGINE_GOOGLE_ANALYTICS_KEY,
          featureFlags: JSON.parse(import.meta.env.IQENGINE_FEATURE_FLAGS ?? null),
        } as Config,
      };
    });
    if (!response.data.connectionInfo) {
      response.data.connectionInfo = JSON.parse(import.meta.env.IQENGINE_CONNECTION_INFO ?? null);
    }
    if (!response.data.googleAnalyticsKey) {
      response.data.googleAnalyticsKey = import.meta.env.IQENGINE_GOOGLE_ANALYTICS_KEY;
    }
    if (!response.data.featureFlags) {
      response.data.featureFlags = JSON.parse(import.meta.env.IQENGINE_FEATURE_FLAGS ?? null);
    }

    for (const member in response.data) {
      if (response.data[member] === null || response.data[member] === undefined) {
        console.log(`Member '${member}' of response.data is null or undefined`);
      }
    }

    return response.data;
  } catch (error) {
    console.error('An error has occurred setting the environment variables.');
    return {
      connectionInfo: JSON.parse(import.meta.env.IQENGINE_CONNECTION_INFO ?? null),
      googleAnalyticsKey: import.meta.env.IQENGINE_GOOGLE_ANALYTICS_KEY,
      featureFlags: JSON.parse(import.meta.env.IQENGINE_FEATURE_FLAGS ?? null),
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
  connectionInfo: ConnectionInfo;
  googleAnalyticsKey: string;
  featureFlags: { [key in FeatureFlag]: boolean };
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
