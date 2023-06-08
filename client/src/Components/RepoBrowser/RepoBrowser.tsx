// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState } from 'react';
import { useEffect } from 'react';
import LocalFileBrowser from './LocalFileBrowser';
import AzureBlobBrowser from './AzureBlobBrowser';
import RepositoryTile from './RepositoryTile';
import RepositoryAPITile from './RepositoryAPITile';
import SiggenTile from './SiggenTile';
import ValidatorTile from './ValidatorTile';
import { configQuery } from '../../api/config/queries';
import { preFetchDataSourcesMeta } from '../../api/metadata/Queries';
import { getDataSources } from '../../api/datasource/Queries';
import { useAppDispatch } from '@/Store/hooks';
import { upsertDataSource } from '@/Store/Reducers/ConnectionReducer';
import { CLIENT_TYPE_API, CLIENT_TYPE_BLOB, DataSource } from '@/api/Models';
import { useQueryClient } from '@tanstack/react-query';

const RepoBrowser = () => {
  let [dataAvailable, setDataAvailable] = useState(false);
  const config = configQuery();
  const apiDataSources = getDataSources(CLIENT_TYPE_API);
  const blobDataSources = getDataSources(CLIENT_TYPE_BLOB, dataAvailable);
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (config.data) {
      // In local mode, CONNECTION_INFO isn't defined
      if (config.data.connectionInfo && config.data.connectionInfo.settings) {
        var dataSources = config.data.connectionInfo.settings.map((item) => {
          var dataSource = {
            name: item.name,
            type: 'blob',
            account: item.accountName,
            container: item.containerName,
            imageURL: item.imageURL,
            sasToken: item.sasToken,
            description: item.description,
          } as DataSource;
          dispatch(upsertDataSource(dataSource));
          return dataSource;
        });
        queryClient.setQueryData(['datasource', CLIENT_TYPE_BLOB], dataSources);
        setDataAvailable(true);
      }
    }
  }, [config.data]);

  useEffect(() => {
    if (blobDataSources.data) {
      blobDataSources.data.forEach((item) => {
        preFetchDataSourcesMeta(queryClient, CLIENT_TYPE_BLOB, item.account, item.container);
      });
    }
  }, [blobDataSources.data]);

  return (
    <div className="home-page">
      {blobDataSources.data?.map((item, i) => (
        <RepositoryTile key={i} item={item} />
      ))}
      {apiDataSources.data?.map((item, i) => (
        <RepositoryAPITile key={i} item={item} />
      ))}
      <LocalFileBrowser />
      <AzureBlobBrowser />
      <SiggenTile />
      <ValidatorTile />
    </div>
  );
};

export default RepoBrowser;
