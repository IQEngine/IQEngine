// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import LocalFileBrowser from './LocalFileBrowser';
import AzureBlobBrowser from './AzureBlobBrowser';
import RepositoryTile from './RepositoryTile';

const RepoBrowser = (props) => {
  const tileObjInfo = JSON.parse(process.env.REACT_APP_CONNECTION_INFO).settings;

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
    </div>
  );
};

export default RepoBrowser;
