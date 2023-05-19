// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState } from 'react';
import Form from 'react-bootstrap/Form';
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
        <Form.Group className="m-3">
          <Form.Label>Storage Account Name:</Form.Label>
          <Form.Control className="mb-3" type="text" defaultValue={accountName} onChange={onAccountNameChange} />
          <Form.Label>Container Name:</Form.Label>
          <Form.Control className="mb-3" type="text" defaultValue={containerName} onChange={onContainerNameChange} />
          <Form.Label>SAS Token for Container:</Form.Label>
          <Form.Control type="password" defaultValue={sasToken} onChange={onSasTokenChange} />
        </Form.Group>
      </div>
      <button className="repocardbutton" onClick={onSubmit}>
        Browse
      </button>
    </div>
  );
};

export default AzureBlobBrowser;
