// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@/Store/hooks';
import { CLIENT_TYPE_BLOB } from '@/api/Models';

export const RepositoryTile = (props) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { item } = props;

  const { name, account, container, imageURL, description, sasToken } = item;
  const [isDisabled, setIsDisabled] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [isError, setIsError] = useState(false);
  const [dayDifference, setDayDifference] = useState<number>();
  const [expires, setExpires] = useState();
  const [writeableBool, setWriteableBool] = useState<any>();

  useEffect(() => {
    const tempExpires = sasToken.slice(sasToken.search('se')).split('&')[0].slice(3, 13); // YEAR-MONTH-DAY
    const writeable = sasToken.slice(sasToken.search('sp')).split('&')[0].includes('w'); // boolean
    if (writeable) {
      setWriteableBool(<div className="mr-2 mt-2 text-xs">R/W</div>);
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

  const handleOnClick = async () => {
    // so we can fetch when someone is linked to a repo directly
    navigate(`/recordings/${CLIENT_TYPE_BLOB}/${account}/${container}/${encodeURIComponent(sasToken)}`);
  };

  return (
    <div className="card w-96 bg-neutral text-neutral-content shadow-xl mb-3">
      <figure>
        <img onClick={handleOnClick} className="object-cover h-48 w-96" src={imageURL ?? "/external_source.png"} alt="Shoes" />
      </figure>
        <div className="card-body">
          <h2 className="card-title text-2xl">{name}</h2>
          <p>{description}</p>
          {!isError && !isWarning && (
            <div className="alert alert-info">
              <span>SAS Token Expiration: {expires}</span>
            </div>
          )}
          {isError && (
            <div className="alert alert-error">
            <span>SAS Token is expired!</span>
          </div>
          )}
          {isWarning && (
            <div className="alert alert-warning">
              <span>This token will expire {dayDifference === 0 ? 'today' : 'in ' + dayDifference + ' days'}</span>
            </div>
          )}
          <div className="card-actions mt-2 justify-end">
            <button className="btn btn-primary w-full" >browse</button>
          </div>
        </div>
    </div>
  );
};

export default RepositoryTile;
