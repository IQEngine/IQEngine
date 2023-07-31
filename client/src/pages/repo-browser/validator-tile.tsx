// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
import { useNavigate } from 'react-router-dom';

const ValidatorTile = (props) => {
  const navigate = useNavigate();

  const handleOnClick = () => {
    navigate('/validator');
  };

  return (
    <div className="repocard">
      <figure>
        <img onClick={handleOnClick} className="repoimage" src="/validator.png" alt="Validator tile" />
      </figure>
      <div className="repocardbody">
        <h2>SigMF Meta Validator</h2>
        Validate your .sigmf-meta file using an interactive JSON schema validator
      </div>
      <button className="repocardbutton" onClick={handleOnClick} id="Validator">
        Browse
      </button>
    </div>
  );
};

export default ValidatorTile;
