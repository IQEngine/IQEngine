// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
import { useNavigate } from 'react-router-dom';

const SiggenTile = (props) => {
  const navigate = useNavigate();

  const handleOnClick = () => {
    navigate('/siggen');
  };

  return (
    <div className="repocard">
      <figure>
        <img onClick={handleOnClick} className="repoimage" src="/siggen.png" alt="Siggen tile" />
      </figure>
      <div className="repocardbody">
        <h2>Signal Generator</h2>
        Generate your own signals in Python, with examples! Save as a SigMF recording
      </div>
      <button onClick={handleOnClick} className="repocardbutton" id="Siggen">
        Browse
      </button>
    </div>
  );
};

export default SiggenTile;
