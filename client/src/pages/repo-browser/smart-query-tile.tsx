// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
import { useNavigate } from 'react-router-dom';

const SmartQueryTile = (props) => {
  const navigate = useNavigate();

  const handleOnClick = () => {
    navigate('/smart-query');
  };

  return (
    <div className="repocard">
      <figure>
        <img onClick={handleOnClick} className="repoimage" src="/query.png" alt="Smart query tile" />
      </figure>
      <div className="repocardbody">
        <h2>Smart Query</h2>
        Open text search across all of the metadata files within the repository.
      </div>
      <button
        className="repocardbutton"
        onClick={handleOnClick}
        id="smart-query-button"
        aria-label="Smart query browse"
      >
        Browse
      </button>
    </div>
  );
};

export default SmartQueryTile;
