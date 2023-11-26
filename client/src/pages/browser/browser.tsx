// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState } from 'react';
import { useEffect } from 'react';
import { useConfigQuery } from '@/api/config/queries';
import { getDataSources } from '@/api/datasource/queries';
import { CLIENT_TYPE_API, CLIENT_TYPE_BLOB, DataSource } from '@/api/Models';
import { useQueryClient } from '@tanstack/react-query';
import Feature from '@/features/feature/Feature';
import { FeatureFlag, useFeatureFlags, FeatureFlagName } from '@/hooks/use-feature-flags';
import { useUserSettings } from '@/api/user-settings/use-user-settings';

export const Browser = () => {
  let [dataAvailable, setDataAvailable] = useState(false);
  const { getFeatureFlag } = useFeatureFlags();
  const config = useConfigQuery();
  const apiDataSources = getDataSources(CLIENT_TYPE_API);
  const queryClient = useQueryClient();
  const { addDataSource } = useUserSettings();
  useEffect(() => {
    if (config.data) {
      // In local mode, IQENGINE_CONNECTION_INFO isn't defined
      if (config.data.connectionInfo && config.data.connectionInfo.settings) {
        var dataSources = config.data.connectionInfo.settings.map((item) => {
          var dataSource = {
            name: item.name,
            type: CLIENT_TYPE_BLOB,
            account: item.accountName,
            container: item.containerName,
            imageURL: item.imageURL,
            sasToken: item.sasToken,
            description: item.description,
          } as DataSource;
          addDataSource(dataSource);
          return dataSource;
        });
        queryClient.setQueryData(['datasource', CLIENT_TYPE_BLOB], dataSources);
        setDataAvailable(true);
      }
    }
  }, [config.data]);

  return (
    <div className="py-3">
      <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-10 justify-items-center">
          {apiDataSources?.data?.map((item, i) => <RepositoryAPITile key={i} item={item} />)}
        </div>
      </div>
    </div>
  );
};

export default Browser;
