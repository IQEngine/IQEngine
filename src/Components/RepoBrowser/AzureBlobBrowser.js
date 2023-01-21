// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Card } from 'react-bootstrap';
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
    props.setRecordingList({ accountName: accountName, containerName: containerName, sasToken: sasToken }); // updates the parent (App.js) state with the RecordingList
    navigate('/recordings'); // data file
    // Parse SAS Token to find if its read/write and other info
  };

  return (
    <Card className="flexOne">
      <Card.Header>Browse Your Own Azure Blob Storage</Card.Header>
      <Card.Body className="cardBodyCenter">
        <Form.Group className="mb-3">
          <Form.Label>Storage Account Name:</Form.Label>
          <Form.Control type="text" defaultValue={accountName} onChange={onAccountNameChange} />
          <Form.Label>Container Name:</Form.Label>
          <Form.Control type="text" defaultValue={containerName} onChange={onContainerNameChange} />
          <Form.Label>SAS Token for Container:</Form.Label>
          <Form.Control type="password" defaultValue={sasToken} onChange={onSasTokenChange} />
        </Form.Group>
      </Card.Body>
      <Button variant="success" onClick={onSubmit}>
        Browse
      </Button>
    </Card>
  );
};

export default AzureBlobBrowser;
