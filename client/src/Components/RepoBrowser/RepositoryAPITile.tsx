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

  // TODO: COPY STYLE BELOW FROM THE OTHER REPOSITORY TILE

  return (
    <div className="repocard">
      <figure>
        <img onClick={handleOnClick} className="repoimage" src={imageURL ?? '/external_source.png'} alt={name} />
      </figure>
      <div className="repocardbody">
        <h2>{name}</h2>
        <p>{description}</p>
      </div>
      <button className="repocardbutton" disabled={isDisabled} id={name.replaceAll(' ', '')} onClick={handleOnClick}>
        Browse
      </button>
    </div>
  );
};

export default RepositoryAPITile;
