// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
import { useNavigate } from 'react-router-dom';

const MetadataQueryTile = (props) => {
  const navigate = useNavigate();

  const handleOnClick = () => {
    navigate('/query');
  };

  return (
    <div className="repocard">
      <figure>
        <img onClick={handleOnClick} className="repoimage" src="/query.png" alt="Metadata query tile" />
      </figure>
      <div className="repocardbody">
        <h2>Metadata Query</h2>
        Query across all of the metadata files within the repository.
      </div>
      <button
        className="repocardbutton"
        onClick={handleOnClick}
        id="metadata-query-button"
        aria-label="Metadata query browse"
      >
        Browse
      </button>
    </div>
  );
};

export default MetadataQueryTile;
