// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { upsertDataSource } from '@/Store/Reducers/ConnectionReducer';
import { useAppDispatch } from '@/Store/hooks';
import { CLIENT_TYPE_BLOB, DataSource } from '@/api/Models';

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
            className="mb-3 w-full rounded mt-1 h-8 p-1 bg-accent text-black"
            type="text"
            defaultValue={account}
            onChange={onAccountNameChange}
          />
          <label>Container Name:</label>
          <input
            className="mb-3 w-full rounded mt-1 h-8 p-1 bg-accent text-black"
            type="text"
            defaultValue={container}
            onChange={onContainerNameChange}
          />
          <label>SAS Token for Container:</label>
          <input
            className="w-full rounded mt-1 h-8 p-1 bg-accent text-black"
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
