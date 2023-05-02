// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const RepositoryTile = (props) => {
  const navigate = useNavigate();
  const {
    item,
    updateConnectionAccountName,
    updateConnectionContainerName,
    updateConnectionSasToken,
    fetchRecordingsList,
  } = props;

  const { name, accountName, containerName, imageURL, description, sasToken } = item;
  const [isDisabled, setIsDisabled] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [isError, setIsError] = useState(false);
  const [dayDifference, setDayDifference] = useState();
  const [expires, setExpires] = useState();
  const [writeableBool, setWriteableBool] = useState();

  useEffect(() => {
    const tempExpires = sasToken.slice(sasToken.search('se')).split('&')[0].slice(3, 13); // YEAR-MONTH-DAY
    const writeable = sasToken.slice(sasToken.search('sp')).split('&')[0].includes('w'); // boolean
    if (writeable) {
      setWriteableBool('R-W');
    } else {
      setWriteableBool('R');
    }
    const todayDate = new Date();
    const todayFormattedDate = todayDate.toISOString().substring(0, 10);
    const tempDayDifference = Math.abs((Date.parse(todayFormattedDate) - Date.parse(tempExpires)) / 86400000);
    setIsWarning(todayFormattedDate <= tempExpires && tempDayDifference <= 7);
    setIsError(todayFormattedDate > tempExpires);
    if (todayFormattedDate > tempExpires) setIsDisabled(true);
    setExpires(tempExpires);
    setDayDifference(tempDayDifference);
  }, [sasToken]);

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
    updateConnectionAccountName(accountName);
    updateConnectionContainerName(containerName);
    updateConnectionSasToken(sasToken);
    fetchRecordingsList({ accountName: accountName, containerName: containerName, sasToken: sasToken });
    // so we can fetch when someone is linked to a repo directly
    navigate(
      '/recordings/?accountName=' +
        accountName +
        '&containerName=' +
        containerName +
        '&sasToken=' +
        encodeURIComponent(sasToken)
    );
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
          {/*
          <div className="mb-2" style={{ marginTop: '10px' }}>
            Account Name: {accountName}
          </div>
          <div className="mb-2">Container Name: {containerName}</div>
          */}
          <br></br>
          <div className="mb-2">{description}</div>
          <div className="mb-3" style={{ color: 'grey' }}>
            SAS Token Expiration: {expires}
          </div>
          {isError && <div style={{ color: 'red' }}>This SAS token is expired</div>}
          {isWarning && (
            <div style={{ color: 'yellow' }}>
              This token will expire {dayDifference === 0 ? 'today' : 'in ' + dayDifference + ' days'}
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
