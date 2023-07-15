import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FeatureFlagName } from '@/hooks/use-feature-flags';

const fetchConfig = async () => {
  try {
    const response = await axios.get<AppConfig>('/api/config').catch((error) => {
      console.error('the failed GET above is due to axios config not found, using env vars instead');
      return {
        data: {
          connectionInfo: JSON.parse(import.meta.env.IQENGINE_CONNECTION_INFO ?? null),
          googleAnalyticsKey: import.meta.env.IQENGINE_GOOGLE_ANALYTICS_KEY,
          featureFlags: JSON.parse(import.meta.env.IQENGINE_FEATURE_FLAGS ?? null),
          internalBranding: import.meta.env.IQENGINE_INTERNAL_BRANDING,
          appId: import.meta.env.IQENGINE_APP_ID,
          appAuthority: import.meta.env.IQENGINE_APP_AUTHORITY,
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

    if (!response.data.internalBranding) {
      response.data.internalBranding = import.meta.env.IQENGINE_INTERNAL_BRANDING;
    }

    if (!response.data.appId) {
      response.data.appId = import.meta.env.IQENGINE_APP_ID;
    }

    if (!response.data.appAuthority) {
      response.data.appAuthority = import.meta.env.IQENGINE_APP_AUTHORITY;
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
      internalBranding: import.meta.env.IQENGINE_INTERNAL_BRANDING,
    } as AppConfig;
  }
};

const updateConfig = async (config: AppConfig) => {
  return await axios
    .put(`/api/config`, config)
    .then((response) => {
      return Promise.resolve(config as AppConfig);
    })
    .catch((error) => {
      console.error(error);
      throw new Error('Failed to update metadata.');
    });
};

export const useUpdateConfig = (config: AppConfig) => {
  let client = useQueryClient();

  return useMutation({
    mutationFn: (config: AppConfig) => {
      return updateConfig(config);
    },
    onMutate: async () => {
      await client.cancelQueries(['config']);
      const previousConfig = client.getQueryData(['config']);
      client.setQueryData(['config'], config);
      return { previousConfig };
    },
    onError: (err, newMeta, context) => {
      console.error('onError', err);
      client.setQueryData(['config'], context.previousConfig);
    },
  });
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
  featureFlags: { [key in FeatureFlagName]: boolean };
  internalBranding: string;
  appId: string;
  appAuthority: string;
};

export const useConfigQuery = () => useQuery(['config'], fetchConfig);
