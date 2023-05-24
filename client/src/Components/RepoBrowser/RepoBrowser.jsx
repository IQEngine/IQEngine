// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState } from 'react';
import { useEffect } from 'react';
import LocalFileBrowser from './LocalFileBrowser';
import AzureBlobBrowser from './AzureBlobBrowser';
import RepositoryTile from './RepositoryTile';
import SiggenTile from './SiggenTile';
import ValidatorTile from './ValidatorTile';
import { configQuery } from '../../api/config/queries';

const RepoBrowser = (props) => {
  let [tileObjInfo, setTitleObjInfo] = useState([]);
  const config = configQuery();
  useEffect(() => {
    if (config.data) {
      // In local mode, CONNECTION_INFO isn't defined
      if (config.data.connectionInfo) {
        setTitleObjInfo(config.data.connectionInfo.settings);
      }
    }
  }, [config]);

  return (
    <div className="homePage">
      {tileObjInfo.map((item, i) => (
        <RepositoryTile
          key={i}
          item={item}
          fetchRecordingsList={props.fetchRecordingsList}
          updateConnectionAccountName={props.updateConnectionAccountName}
          updateConnectionContainerName={props.updateConnectionContainerName}
          updateConnectionSasToken={props.updateConnectionSasToken}
        />
      ))}
      <LocalFileBrowser
        fetchRecordingsList={props.fetchRecordingsList}
        updateConnectionMetaFileHandle={props.updateConnectionMetaFileHandle}
        updateConnectionDataFileHandle={props.updateConnectionDataFileHandle}
        metafilehandle={props.metafilehandle}
        datafilehandle={props.datafilehandle}
      />
      <AzureBlobBrowser
        fetchRecordingsList={props.fetchRecordingsList}
        updateConnectionAccountName={props.updateConnectionAccountName}
        updateConnectionContainerName={props.updateConnectionContainerName}
        updateConnectionSasToken={props.updateConnectionSasToken}
      />
      <SiggenTile />
      <ValidatorTile />
    </div>
  );
};

export default RepoBrowser;
