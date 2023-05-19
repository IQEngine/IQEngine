// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect } from 'react';
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
      setWriteableBool(<div className="mr-2 mt-2 text-xs">R-W</div>);
    } else {
      setWriteableBool(
        <div className="mr-2 mt-2 text-xs inline">
          R<div className="inline text-gray-400">/W</div>
        </div>
      );
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
    <div className="flexOne repocard">
      <div className="repocardheader" style={{ display: 'flex', justifyContent: 'space-between' }}>
        {<div style={{ marginTop: 'auto' }}>{name}</div>} {writeableBool}
      </div>
      <div className="repocardbody">
        <center>
          {imageURL && <img src={imageURL} className="w-48 rounded-xl"></img>}
          <div className="mb-2 mt-3">{description}</div>
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
      </div>
      <button className="repocardbutton" disabled={isDisabled} id={name.replaceAll(' ', '')} onClick={handleOnClick}>
        Browse
      </button>
    </div>
  );
};

export default RepositoryTile;
