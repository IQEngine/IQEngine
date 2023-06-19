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
    <div className="card w-96 bg-neutral text-neutral-content shadow-xl mb-3">
      <figure>
        <img onClick={handleOnClick} className="object-cover h-48 w-96" src={imageURL ?? '/api.png'} alt="Shoes" />
      </figure>
      <div className="card-body">
        <h2 className="card-title text-2xl">{name}</h2>
        <p>{description}</p>
        <div className="card-actions mt-2 justify-end">
          <button
            id={name.replaceAll(' ', '')}
            disabled={isDisabled}
            onClick={handleOnClick}
            className="btn btn-primary w-full"
            aria-label={name}
          >
            browse
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepositoryAPITile;
