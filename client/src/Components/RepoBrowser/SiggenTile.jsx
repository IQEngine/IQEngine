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
      <div className="repocardheader">Signal Generator</div>
      <div className="repocardbody">
        <div className="grid content-center justify-center">
          <img
            className="my-4 rounded-xl justify-center"
            src="/siggen.png"
            width="200px"
            alt="DALLE prompt - signal generator in the style of dr. seuss with a control panel"
          ></img>
        </div>
        <div className="text-center">Generate your own signals in Python, with examples!</div>
        <div className="text-center"> Save as a SigMF recording!</div>
        <br /> <br />
      </div>
      <button className="repocardbutton" onClick={handleOnClick}>
        Siggen
      </button>
    </div>
  );
};

export default SiggenTile;
