// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const RepositoryTile = (props) => {
  const navigate = useNavigate();
  const {
    item,
    updateConnectionAccountName,
    updateConnectionContainerName,
    updateConnectionSasToken,
    setRecordingList,
  } = props;
  const { name, accountName, containerName, imageURL, description, sasToken } = item;
  const expires = sasToken.slice(sasToken.search('se')).split('&')[0].slice(3, 13); // YEAR-MONTH-DAY
  const writeable = sasToken.slice(sasToken.search('sp')).split('&')[0].includes('w'); // boolean

  let writeableBool = null;

  if (writeable) {
    writeableBool = 'R-W';
  } else {
    writeableBool = 'R';
  }
  console.log(writeableBool);

  const [isDisabled, setIsDisabled] = useState(false);

  const errorDiv = useRef('');
  const todayDate = new Date();
  const todayFormattedDate = todayDate.toISOString().substring(0, 10);
  const dayDifference = Math.abs((Date.parse(todayFormattedDate) - Date.parse(expires)) / 86400000);

  const isWarning = todayFormattedDate <= expires && dayDifference <= 7;

  const styleErrorDiv = {
    display: 'none',
  };

  const styleRW = {
    border: '2px solid lightblue',
    width: 'fit-content',
    padding: '3px',
    borderRadius: '5px',
  };

  const styleHeight = {
    width: 200,
    height: 200,
  };

  const handleOnClick = () => {
    if (todayFormattedDate > expires) {
      setIsDisabled(true);
      errorDiv.current.style = 'auto';
      errorDiv.current.style.color = 'red';
    } else {
      updateConnectionAccountName(accountName);
      updateConnectionContainerName(containerName);
      updateConnectionSasToken(sasToken);
      setRecordingList({ accountName: accountName, containerName: containerName, sasToken: sasToken }); // updates the parent (App.js) state with the RecordingList
      navigate('/recordings'); // data file
    }
  };

  return (
    <Card className="flexOne">
      <Card.Header style={{ display: 'flex', justifyContent: 'space-between' }}>
        {<div style={{ marginTop: 'auto' }}>{name}</div>} <div style={styleRW}>{writeableBool}</div>
      </Card.Header>
      <Card.Body>
        <center>
          {imageURL && <Card.Img variant="top" src={imageURL} style={styleHeight}></Card.Img>}
          <br />
          <div className="mb-2" style={{ marginTop: '10px' }}>
            Account Name: {accountName}
          </div>
          <div className="mb-2">Container Name: {containerName}</div>
          <div className="mb-2">{description}</div>
          <div className="mb-3">SAS Token Expiration: {expires}</div>
          <div ref={errorDiv} style={styleErrorDiv}>
            ERROR - This SAS token is expired
          </div>
          {isWarning && (
            <div style={{ color: 'yellow' }}>
              WARNING - this token will expire {dayDifference === 0 ? 'today' : 'in ' + dayDifference + ' days'}
            </div>
          )}
        </center>
      </Card.Body>
      <Button variant="success" disabled={isDisabled} onClick={handleOnClick}>
        Browse
      </Button>
    </Card>
  );
};

export default RepositoryTile;
