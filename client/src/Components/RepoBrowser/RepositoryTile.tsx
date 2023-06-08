// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@/Store/hooks';
import { CLIENT_TYPE_BLOB } from '@/api/Models';

const RepositoryTile = (props) => {
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
    <div className="repocard">
      <h2 className="repocardheader flex content-center justify-center">
        {<div className="text-neutral mr-2">{name}</div>} {writeableBool}
      </h2>
      <div className="repocardbody">
        <figure>{imageURL && <img src={imageURL} className="rounded-2xl px-2 h-36"></img>}</figure>
        <div className="h-24 overflow-hidden hover:overflow-auto text-center">{description}</div>
        <div className="text-secondary text-center">SAS Token Expiration: {expires}</div>
        {isError && <div style={{ color: 'red' }}>This SAS token is expired</div>}
        {isWarning && (
          <div style={{ color: 'yellow' }}>
            This token will expire {dayDifference === 0 ? 'today' : 'in ' + dayDifference + ' days'}
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
