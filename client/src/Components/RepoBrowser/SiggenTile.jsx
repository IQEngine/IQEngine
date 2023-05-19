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
    <div className="flexOne repocard">
      <div className="repocardheader" style={{ display: 'flex', justifyContent: 'space-between' }}>
        Signal Generator
      </div>
      <div className="repocardbody">
        <center>
          <img
            className="my-4 rounded-xl"
            src="/siggen.png"
            width="200px"
            alt="DALLE prompt - signal generator in the style of dr. seuss with a control panel"
          ></img>
          Generate your own signals in Python, with examples!
          <br /> <br />
          Save as a SigMF recording!
          <br /> <br />
        </center>
      </div>
      <button className="repocardbutton" onClick={handleOnClick}>
        Siggen
      </button>
    </div>
  );
};

export default SiggenTile;
