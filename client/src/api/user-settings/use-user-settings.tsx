import { CLIENT_TYPE_BLOB, DataSource } from '@/api/Models';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';
import { AppConfig, useConfigQuery } from '@/api/config/queries';
import { useState } from 'react';

async function getDataSources(config: AppConfig): Promise<Record<string, DataSource>> {
  return config.connectionInfo && config.connectionInfo.settings
    ? config.connectionInfo.settings.reduce((acc, item) => {
        acc[`${item.accountName}/${item.containerName}`] = {
          name: item.name,
          type: CLIENT_TYPE_BLOB,
          account: item.accountName,
          container: item.containerName,
          imageURL: item.imageURL,
          sasToken: item.sasToken,
          description: item.description,
        } as DataSource;
        return acc;
      }, {} as Record<string, DataSource>)
    : {};
}

export interface UserPreferences {
  colorMap: string;
}

export const useUserSettings = () => {
  const queryClient = useQueryClient();

  const filesQuery = useQuery<FileWithDirectoryAndFileHandle[]>(['user-settings', 'local-files'], () =>
    Promise.resolve([])
  );

  const setFiles = (files: FileWithDirectoryAndFileHandle[]) => {
    queryClient.setQueryData(['user-settings', 'local-files'], files);
  };

  const setDataSources = (dataSources: Record<string, DataSource>) => {
    queryClient.setQueryData(['user-settings', 'blob-data-sources'], dataSources);
  };

  const addDataSource = (dataSource: DataSource) => {
    const dataSources = queryClient.getQueryData<Record<string, DataSource>>(['user-settings', 'blob-data-sources']);
    if (dataSources) {
      dataSources[`${dataSource.account}/${dataSource.container}`] = dataSource;
      setDataSources(dataSources);
    }
  };

  const userPreferencesQuery = useQuery<UserPreferences>(['user-settings', 'preferences'], () =>
    Promise.resolve({
      colorMap: 'viridis',
    })
  );

  const setUserPreferences = (preferences: UserPreferences) => {
    queryClient.setQueryData(['user-settings', 'preferences'], preferences);
  };

  const { data: config } = useConfigQuery();
  const dataSourcesQuery = useQuery<Record<string, DataSource>>(
    ['user-settings', 'blob-data-sources'],
    () => getDataSources(config),
    {
      enabled: !!config,
    }
  );

  return {
    filesQuery,
    setFiles,
    dataSourcesQuery,
    addDataSource,
    userPreferencesQuery,
    setUserPreferences,
  };
};
