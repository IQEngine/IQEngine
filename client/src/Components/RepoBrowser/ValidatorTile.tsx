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
      <div className="repocardheader">SigMF Meta Validator</div>
      <div className="repocardbody">
        <div className="grid content-center justify-center">
          <button className="m-0 p-0">
            <img
              className=""
              src="/validator.png"
              width="200px"
              alt="DALLE prompt - thumbs up with radio waves in the theme of dr suess solid dark background"
              onClick={handleOnClick}
            ></img>
          </button>
        </div>
        <div className="text-center">Validate your .sigmf-meta file using an interactive JSON schema validator</div>
      </div>
      <button className="repocardbutton" onClick={handleOnClick}>
        Validator
      </button>
    </div>
  );
};

export default ValidatorTile;
