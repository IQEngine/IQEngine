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
    <div className="flexOne repocard">
      <div className="repocardheader" style={{ display: 'flex', justifyContent: 'space-between' }}>
        SigMF Meta Validator
      </div>
      <div className="repocardbody">
        <center>
          <img
            className="my-4"
            src="/validator.png"
            width="200px"
            alt="DALLE prompt - thumbs up with radio waves in the theme of dr suess solid dark background"
          ></img>
          Validate your .sigmf-meta file using an interactive JSON schema validator
          <br></br>
          <br></br>
        </center>
      </div>
      <button className="repocardbutton" onClick={handleOnClick}>
        Validator
      </button>
    </div>
  );
};

export default ValidatorTile;
