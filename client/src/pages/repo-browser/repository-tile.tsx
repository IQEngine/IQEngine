// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { CLIENT_TYPE_BLOB } from '@/api/Models';

export const RepositoryTile = (props) => {
  const navigate = useNavigate();
  const { item } = props;

  const { name, account, container, imageURL, description, sasToken } = item;
  const [isDisabled, setIsDisabled] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [dayDifference, setDayDifference] = useState<number>();
  const [expires, setExpires] = useState();
  const [writeableBool, setWriteableBool] = useState<any>();

  useEffect(() => {
    let writeable = false;
    if (sasToken == '') {
      setIsPublic(true);
    } else {
      const tempExpires = sasToken.slice(sasToken.search('se')).split('&')[0].slice(3, 13); // YEAR-MONTH-DAY
      writeable = sasToken.slice(sasToken.search('sp')).split('&')[0].includes('w'); // boolean
      const todayDate = new Date();
      const todayFormattedDate = todayDate.toISOString().substring(0, 10);
      const tempDayDifference = Math.abs((Date.parse(todayFormattedDate) - Date.parse(tempExpires)) / 86400000);
      setIsWarning(todayFormattedDate <= tempExpires && tempDayDifference <= 7);
      setIsError(todayFormattedDate > tempExpires);
      if (todayFormattedDate > tempExpires) setIsDisabled(true);
      setExpires(tempExpires);
      setDayDifference(tempDayDifference);
    }
    if (writeable) {
      setWriteableBool(<div className="mr-2 mt-2 text-xs">R/W</div>);
    } else {
      setWriteableBool(
        <div className="mr-2 mt-2 text-xs inline">
          R<div className="inline text-gray-400">/W</div>
        </div>
      );
    }
  }, [sasToken]);

  const handleOnClick = async () => {
    // so we can fetch when someone is linked to a repo directly
    navigate(`/recordings/${CLIENT_TYPE_BLOB}/${account}/${container}/${encodeURIComponent(sasToken)}`);
  };

  return (
    <div className="repocard">
      <figure>
        <img onClick={handleOnClick} className="repoimage" src={imageURL ?? '/external_source.png'} alt={name} />
      </figure>
      <div className="repocardbody">
        <h2>{name}</h2>
        <div className="text-primary absolute right-1 translate-x-1">{writeableBool}</div>
        <p>{description}</p>
        {!isError && !isWarning && !isPublic && (
          <div className="text-secondary">
            <span>SAS Token Expiration: {expires}</span>
          </div>
        )}
        {isError && (
          <div className="text-red-600">
            <span>SAS Token is expired!</span>
          </div>
        )}
        {isWarning && (
          <div className="text-yellow-400">
            <span>This token will expire {dayDifference === 0 ? 'today' : 'in ' + dayDifference + ' days'}</span>
          </div>
        )}
      </div>
      <button className="repocardbutton" disabled={isDisabled} id={name.replaceAll(' ', '')} onClick={handleOnClick}>
        Browse
      </button>
    </div>
  );
};

export default RepositoryTile;
