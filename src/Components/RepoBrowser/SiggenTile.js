// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const SiggenTile = (props) => {
  const navigate = useNavigate();

  const handleOnClick = () => {
    navigate('/siggen');
  };

  const styleHeight = {
    width: 150,
    height: 150,
  };

  return (
    <Card className="flexOne">
      <Card.Header style={{ display: 'flex', justifyContent: 'space-between' }}>
        {<div style={{ marginTop: 'auto' }}>Signal Generator</div>}
      </Card.Header>
      <Card.Body>
        <center>
          <br />
          <Card.Img
            variant="top"
            src="/siggen.png"
            alt="DALLE prompt - signal generator in the style of dr. seuss with a control panel"
            style={styleHeight}
          ></Card.Img>
          <br /> <br />
          Generate your own signals in Python, with examples!
          <br /> <br />
          Save as a SigMF recording!
        </center>
      </Card.Body>
      <Button variant="success" onClick={handleOnClick}>
        Siggen
      </Button>
    </Card>
  );
};

export default SiggenTile;
