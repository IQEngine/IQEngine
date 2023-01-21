// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import '@fortawesome/react-fontawesome';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Routes, Route } from 'react-router-dom';
import RepoBrowserContainer from './Containers/RepoBrowserContainer';
import SpectrogramContainer from './Containers/SpectrogramContainer';
import RecordingsListContainer from './Containers/RecordingsListContainer';
import { Navbar, Row, Col } from 'react-bootstrap';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import { About } from './About';

const App = () => {
  return (
    <div>
      <Row style={{ marginTop: '10px' }}>
        <Col></Col>
        <Col md="7" style={{ textAlign: 'center' }}>
          <a href="/">
            <img src="./IQEngine.svg" alt="IQEngine" />
          </a>
        </Col>
        <Col>
          <Navbar variant="dark">
            <Container className="nav justify-content-end">
              <Nav.Link href="/" style={{ fontSize: '24px' }}>
                Home
              </Nav.Link>
              <Nav.Link href="/about" style={{ fontSize: '24px' }}>
                About
              </Nav.Link>
            </Container>
          </Navbar>
        </Col>
      </Row>

      <Routes>
        <Route path="/about" element={<About />} />
        <Route exact path="/" element={<RepoBrowserContainer />} />
        <Route path="/recordings" element={<RecordingsListContainer />} />
        <Route path="/recordings/spectrogram/:recording" element={<SpectrogramContainer />} />
      </Routes>
    </div>
  );
};
export default App;
