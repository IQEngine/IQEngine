import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { FeatureFlag } from '@/hooks/useFeatureFlags';

const fetchConfig = async () => {
  try {
    const response = await axios.get<AppConfig>('/api/config').catch((error) => {
      console.error('the failed GET above is due to axios config not found, using env vars instead');
      return {
        data: {
          connectionInfo: JSON.parse(import.meta.env.IQENGINE_CONNECTION_INFO ?? null),
          googleAnalyticsKey: import.meta.env.IQENGINE_GOOGLE_ANALYTICS_KEY,
          featureFlags: JSON.parse(import.meta.env.IQENGINE_FEATURE_FLAGS ?? null),
        } as AppConfig,
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
    } as AppConfig;
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

export type AppConfig = {
  connectionInfo: ConnectionInfo;
  googleAnalyticsKey: string;
  featureFlags: { [key in FeatureFlag]: boolean };
};

export const useConfigQuery = () => useQuery(['config'], fetchConfig);
