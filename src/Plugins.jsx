// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const styleMargins = {
  marginTop: 20,
  marginBottom: 20,
};

export const Plugins = () => {
  return (
    <div>
      <Row style={{ padding: '10px' }}></Row>
      <div style={{ backgroundColor: '#303030', width: 'auto' }}>
        <Row style={{ styleMargins }}>
          <center>
            <h1
              style={{
                color: '#04b889',
                fontWeight: 'bold',
                marginTop: '30px',
                marginBottom: '10px',
              }}
            >
              Plugins Concept
            </h1>
          </center>
          <Col xs={3}></Col>
          <Col xs={6}>
            <Row style={{ marginBottom: '15px', paddingBottom: '15px', fontSize: '20px' }}>
              <center>
                Through an optional backend API, IQEngine will support various plugins (currently, only signal
                detection/classification is supported). IQEngine is still in its infancy and we are looking for people
                to help develop the concept and create example plugins!
              </center>
              <ul style={{ marginTop: '25px', marginBottom: '25px' }}>
                <li>
                  A signal detector (with optional classifier) can be triggered in the main spectrogram page, which
                  displays the output in the form of SigMF annotations, convinient for testing new
                  detection/classification algorithms - <a href="openapi">Link to our OpenAPI Spec</a>
                </li>
                <li>Signal demodulators/decoders that take in IQ and output bytes, imagery, audio, etc</li>
                <li>
                  Other DSP modules letting you perform a variety of signal processing functions and other IQ sample
                  manipulation
                </li>
              </ul>
              Current concept plan:
              <br></br> <br></br>
              <center>
                <img
                  src="./plugins_concept.png"
                  style={{ width: '600px', paddingBottom: '15px' }}
                  alt="plugins concept"
                ></img>
              </center>
            </Row>
          </Col>
          <Col xs={3}></Col>
        </Row>
      </div>
    </div>
  );
};
