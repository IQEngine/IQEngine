// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { upsertDataSource } from '@/Store/Reducers/ConnectionReducer';
import { useAppDispatch } from '@/Store/hooks';
import { CLIENT_TYPE_BLOB, DataSource } from '@/api/Models';
import toast from 'react-hot-toast';

const AzureBlobBrowser = () => {
  const dispatch = useAppDispatch();
  const [account, setAccount] = useState('');
  const [container, setContainer] = useState('');
  const [sasToken, setSasToken] = useState('');
  const navigate = useNavigate();
  const onAccountNameChange = (event) => {
    setAccount(event.target.value);
  };

  const onContainerNameChange = (event) => {
    setContainer(event.target.value);
  };

  const onSasTokenChange = (event) => {
    setSasToken(event.target.value);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (account === '' || container === '' || sasToken === '') {
      toast('Please fill in all blob fields', {
        duration: 5000,
        position: 'top-center',
        icon: '😖',
        className: 'bg-red-100 font-bold',
      });
      return;
    }
    // This code has been extracted from the way that validation of sas token it si done now on RepoBrowser.tsx
    const tempExpires = sasToken.slice(sasToken.search('se')).split('&')[0].slice(3, 13); // YEAR-MONTH-DAY
    if (tempExpires.length !== 10) {
      toast('SAS token invalid', {
        icon: '😖',
        className: 'bg-red-100 font-bold',
      });
      return;
    }
    const todayDate = new Date();
    const todayFormattedDate = todayDate.toISOString().substring(0, 10);
    const tempDayDifference = Math.abs((Date.parse(todayFormattedDate) - Date.parse(tempExpires)) / 86400000);
    if (todayFormattedDate > tempExpires) {
      toast('SAS Token has expired', {
        icon: '😖',
        className: 'bg-red-100 font-bold',
      });
      return;
    } else if (tempDayDifference < 7) {
      toast('Warning this is close to expiration', {
        icon: '⚠️',
      });
    }
    var dataSource = {
      name: account + '/' + container,
      type: 'blob',
      account: account,
      container: container,
      sasToken: sasToken,
      description: 'Azure Blob Storage',
    } as DataSource;
    dispatch(upsertDataSource(dataSource));
    navigate(`/recordings/${CLIENT_TYPE_BLOB}/${account}/${container}/${encodeURIComponent(sasToken)}`);
  };

  return (
    <div className="repocard">
      <h2 className="repocardheader grid content-center justify-center">Browse Your Azure Blob Storage</h2>
      <div className="card-body">
        <form className="m-3 mt-8">
          <label>Storage Account Name:</label>
          <input
            className="mb-3 w-full rounded mt-1 h-8 p-1 bg-accent text-base-100"
            type="text"
            defaultValue={account}
            onChange={onAccountNameChange}
          />
          <label>Container Name:</label>
          <input
            className="mb-3 w-full rounded mt-1 h-8 p-1 bg-accent text-base-100"
            type="text"
            defaultValue={container}
            onChange={onContainerNameChange}
          />
          <label>SAS Token for Container:</label>
          <input
            className="w-full rounded mt-1 h-8 p-1 bg-accent text-base-100"
            type="password"
            defaultValue={sasToken}
            onChange={onSasTokenChange}
          />
        </form>
      </div>
      <button className="repocardbutton " onClick={onSubmit}>
        Browse
      </button>
    </div>
  );
};

export default AzureBlobBrowser;
