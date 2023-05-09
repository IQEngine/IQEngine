// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ValidatorTile = (props) => {
  const navigate = useNavigate();

  const handleOnClick = () => {
    navigate('/validator');
  };

  const styleHeight = {
    width: 150,
    height: 150,
  };

  return (
    <Card className="flexOne">
      <Card.Header style={{ display: 'flex', justifyContent: 'space-between' }}>
        {<div style={{ marginTop: 'auto' }}>SigMF Meta Validator</div>}
      </Card.Header>
      <Card.Body>
        <center>
          <br />
          <Card.Img
            variant="top"
            src="/validator.png"
            alt="DALLE prompt - thumbs up with radio waves in the theme of dr suess solid dark background"
            style={styleHeight}
          ></Card.Img>
          <br /> <br />
          Validate your .sigmf-meta file using an interactive JSON schema validator
        </center>
      </Card.Body>
      <Button variant="success" onClick={handleOnClick}>
        Validator
      </Button>
    </Card>
  );
};

export default ValidatorTile;
