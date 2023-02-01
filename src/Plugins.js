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
              Plugins Concepts
            </h1>
          </center>
          <Col xs={3}></Col>
          <Col xs={6}>
            {' '}
            <Row style={{ marginBottom: '15px', paddingBottom: '15px', fontSize: '20px' }}>
              <center>Through the optional backend API, IQEngine supports three different classes of plugins:</center>
              <ol class="list-group list-group-numbered" style={{ marginTop: '25px', marginBottom: '25px' }}>
                <li class="list-group-item">
                  A signal detector (with optional classifier) can be triggered in the main spectrogram page, which will
                  display the output annotations as soon as it finishes, convinient for testing new
                  detection/classification algorithms.
                </li>
                <li class="list-group-item">
                  A DSP module runs prior to the FFT calculations, letting you perform a variety of signal processing
                  functions and other IQ sample manipulation. It currently only supports Python snippets, where the
                  samples out must be the same length as samples in (for now). Support for C/C++ and Rust DSP plugins is
                  on the todo list.
                </li>
                <li class="list-group-item">
                  A signal generator creates a new signal given a set of parameters (not yet released)
                </li>
              </ol>
              <center>
                <img
                  src="./IQEngine_Plugins.svg"
                  style={{ width: '600px', paddingBottom: '15px' }}
                  alt="plugins concept"
                ></img>
              </center>
              <center>
                Plugins within IQEngine is still in its infancy and we are looking for people to help develop the
                concept and create example plugins!
              </center>
            </Row>
          </Col>
          <Col xs={3}></Col>
        </Row>
      </div>
    </div>
  );
};
