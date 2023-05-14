// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
import LocalFileBrowser from './LocalFileBrowser';
import AzureBlobBrowser from './AzureBlobBrowser';
import RepositoryTile from './RepositoryTile';
import SiggenTile from './SiggenTile';
import ValidatorTile from './ValidatorTile';

const RepoBrowser = (props) => {
  let tileObjInfo = [];
  // In local mode, CONNECTION_INFO isn't defined
  if (import.meta.env.VITE_CONNECTION_INFO) {
    tileObjInfo = JSON.parse(import.meta.env.VITE_CONNECTION_INFO).settings;
  }

  return (
    <div className="homePage">
      {tileObjInfo.map((item, i) => (
        <RepositoryTile
          key={i}
          item={item}
          fetchRecordingsList={props.fetchRecordingsList}
          updateConnectionAccountName={props.updateConnectionAccountName}
          updateConnectionContainerName={props.updateConnectionContainerName}
          updateConnectionDomainName={props.updateConnectionDomainName}
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
        updateConnectionDomainName={props.updateConnectionDomainName}
        updateConnectionSasToken={props.updateConnectionSasToken}
      />
      <SiggenTile />
      <ValidatorTile />
    </div>
  );
};

export default RepoBrowser;
