// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AzureBlobBrowser = (props) => {
  const [accountName, setAccountName] = useState(props.accountName);
  const [containerName, setContainerName] = useState(props.containerName);
  const [sasToken, setSasToken] = useState(props.sasToken);
  const navigate = useNavigate();
  const onAccountNameChange = (event) => {
    setAccountName(event.target.value);
  };

  const onContainerNameChange = (event) => {
    setContainerName(event.target.value);
  };

  const onSasTokenChange = (event) => {
    setSasToken(event.target.value);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    props.updateConnectionAccountName(accountName);
    props.updateConnectionContainerName(containerName);
    props.updateConnectionSasToken(sasToken);
    props.fetchRecordingsList({ accountName: accountName, containerName: containerName, sasToken: sasToken });
    navigate('/recordings', { accountName: accountName, containerName: containerName, sasToken: sasToken }); // include args in URL for linking-sake
  };

  return (
    <div className="flexOne repocard">
      <div className="repocardheader">Browse Your Azure Blob Storage</div>
      <div className="repocardbody">
        <form className="m-3 mt-0">
          <label>Storage Account Name:</label>
          <input
            className="mb-3 w-full rounded mt-1 h-8 p-1 bg-iqengine-tertiary text-black"
            type="text"
            defaultValue={accountName}
            onChange={onAccountNameChange}
          />
          <label>Container Name:</label>
          <input
            className="mb-3 w-full rounded mt-1 h-8 p-1 bg-iqengine-tertiary text-black"
            type="text"
            defaultValue={containerName}
            onChange={onContainerNameChange}
          />
          <label>SAS Token for Container:</label>
          <input
            className="w-full rounded mt-1 h-8 p-1 bg-iqengine-tertiary text-black"
            type="password"
            defaultValue={sasToken}
            onChange={onSasTokenChange}
          />
        </form>
      </div>
      <button className="repocardbutton" onClick={onSubmit}>
        Browse
      </button>
    </div>
  );
};

export default AzureBlobBrowser;
