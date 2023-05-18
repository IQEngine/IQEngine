// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Card } from 'react-bootstrap';
import Modal from 'react-bootstrap/Modal';

const styleMargins = {
  marginTop: 20,
  marginBottom: 20,
};

export const SigMF = () => {
  const [show, setShow] = useState(false);

  return (
    <div>
      <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Body className="modal-body-centered">
          <img src="./sigmf-diagram.svg" alt="What is SigMF? Larger" width="800" onClick={() => setShow(true)} />
        </Modal.Body>
      </Modal>

      <Row style={{ padding: '10px' }}></Row>
      <div style={{ width: 'auto' }}>
        <Row style={{ styleMargins }}>
          <center>
            <h1
              className="text-iqengine-primary"
              style={{
                fontWeight: 'bold',
                marginTop: '30px',
                marginBottom: '30px',
                fontSize: '28px',
              }}
            >
              What is SigMF?
            </h1>
          </center>
          <Col xs={1}></Col>
          <Col xs={5}>
            <div className="container">
              <p style={{ padding: '0px', fontSize: '20px', textAlign: 'justify' }}>
                The Signal Metadata Format (SigMF) specifies a way to describe sets of recorded digital signals with
                metadata written in JSON. It was designed for RF recordings, which consist of IQ samples. SigMF can be
                used to describe general information about the RF recording, the characteristics of the system that
                generated the samples, and features of the signal itself.
                <br></br>
                <br></br>
                By using SigMF instead of a bespoke solution, IQEngine and other tooling maintain interoperability with
                the same files, promoting sharing of recordings. The IQEngine{' '}
                <a href="https://discord.gg/k7C8kp3b76" target="_blank">
                  Discord
                </a>{' '}
                contains a channel for discussion of any SigMF-related topics!
                <br></br>
                <br></br>
                <center>
                  <a href="https://github.com/sigmf/SigMF" target="_blank">
                    SigMF's GitHub
                  </a>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <a href="https://github.com/sigmf/SigMF/blob/sigmf-v1.x/sigmf-spec.md" target="_blank">
                    SigMF Specification
                  </a>
                  <br></br>
                  <br></br>
                  <img src="./sigmf_logo_cropped.gif" alt="SigMF animated logo" width="200" />
                </center>
              </p>
            </div>
          </Col>
          <Col xs={4}>
            <img src="./sigmf-diagram.svg" alt="What is SigMF?" width="600" onClick={() => setShow(true)} />
            <br></br>
            <br></br>
          </Col>
          <Col xs={2}></Col>
        </Row>
      </div>
    </div>
  );
};
