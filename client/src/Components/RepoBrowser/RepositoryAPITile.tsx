// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@/Store/hooks';
import { CLIENT_TYPE_API } from '@/api/Models';

const RepositoryAPITile = (props) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { item } = props;

  const { type, name, account, container, imageURL, description } = item;
  const [isDisabled, setIsDisabled] = useState(false);

  const handleOnClick = async () => {
    // so we can fetch when someone is linked to a repo directly
    navigate(`/recordings/${CLIENT_TYPE_API}/${account}/${container}`);
  };

  return (
    <div className="repocard">
      <h2 className="repocardheader">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 whitespace-nowrap">{name}</div>
        <div className="absolute right-0 translate-x-1 -translate-y-2">
          <div className="mr-2 mt-2 text-xs">R/W</div>
        </div>
      </h2>
      <div className="repocardbody">
        <figure>{imageURL && <img src={imageURL} className="rounded-2xl px-2 h-36"></img>}</figure>
        <div className="h-24 overflow-hidden hover:overflow-auto text-center">{description}</div>
      </div>
      <button
        className="repocardbutton"
        aria-label={name}
        disabled={isDisabled}
        id={name.replaceAll(' ', '')}
        onClick={handleOnClick}
      >
        Browse
      </button>
    </div>
  );
};

export default RepositoryAPITile;
