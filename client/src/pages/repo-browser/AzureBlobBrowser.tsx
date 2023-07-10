// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CLIENT_TYPE_BLOB, DataSource } from '@/api/Models';
import { useUserSettings } from '@/api/user-settings/use-user-settings';
import toast from 'react-hot-toast';

const AzureBlobBrowser = () => {
  const [account, setAccount] = useState('');
  const [container, setContainer] = useState('');
  const [sasToken, setSasToken] = useState('');
  const { addDataSource } = useUserSettings();
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
      toast('Please fill in all blob storage account credential fields.', {
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
      toast('Warning: the SAS token is within 7 days of expiration.', {
        icon: '⚠️',
      });
    }
    var dataSource = {
      name: account + '/' + container,
      type: CLIENT_TYPE_BLOB,
      account: account,
      container: container,
      sasToken: sasToken,
      description: 'Azure Blob Storage',
    } as DataSource;

    addDataSource(dataSource);
    navigate(`/recordings/${CLIENT_TYPE_BLOB}/${account}/${container}/${encodeURIComponent(sasToken)}`);
  };

  return (
    <div className="repocard">
      <figure>
        <img className="repoimage" width="150px" src="/storage-blob.svg" alt="Azure blob explorer tile" />
      </figure>
      <div className="repocardbody">
        <h2>Azure Blob Storage</h2>
        <form>
          <input
            type="text"
            placeholder="Storage Account Name"
            defaultValue={account}
            onChange={onAccountNameChange}
            className="input input-bordered input-success w-full max-w-xs"
          />
          <input
            type="text"
            placeholder="Container Name"
            defaultValue={container}
            onChange={onContainerNameChange}
            className="mt-2 input input-bordered input-success w-full max-w-xs"
          />
          <input
            type="password"
            placeholder="SAS Token"
            defaultValue={sasToken}
            onChange={onSasTokenChange}
            className="mt-2 input input-bordered input-success w-full max-w-xs"
          />
        </form>
      </div>
      <button className="repocardbutton" onClick={onSubmit} id="AzureBlob">
        Browse
      </button>
    </div>
  );
};

export default AzureBlobBrowser;
