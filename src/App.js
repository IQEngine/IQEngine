// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useEffect } from 'react';
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
import ReactGA from 'react-ga';

const TRACKING_ID = 'G-NEM78RS5ZF';
ReactGA.initialize(TRACKING_ID);

const App = () => {
  useEffect(() => {
    ReactGA.pageview(window.location.pathname + window.location.search);
  }, []);

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

      {/* TODO Figure out how to use mailerlites embedded form*/}
      <div class="container">
        <Row style={{ marginTop: '30px', marginBottom: '30px' }}>
          <a target="_blank" href="https://dashboard.mailerlite.com/forms/299501/77960409531811734/share">
            <center>
              <h5>Sign up for a once-a-month email update on IQEngine, such as new features, demos, and more!</h5>
            </center>
          </a>
        </Row>
      </div>
    </div>
  );
};
export default App;
