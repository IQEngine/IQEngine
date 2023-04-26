// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useEffect } from 'react';
import '@fortawesome/react-fontawesome';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Routes, Route, useLocation } from 'react-router-dom';
import RepoBrowserContainer from './Containers/RepoBrowserContainer';
import SpectrogramContainer from './Containers/SpectrogramContainer';
import SignalGenerator from './Components/SignalGenerator/SignalGenerator';
import RecordingsListContainer from './Containers/RecordingsListContainer';
import { Navbar, Row, Col } from 'react-bootstrap';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import { About } from './About';
import { Plugins } from './Plugins';
import ReactGA from 'react-ga4';
import { RedocStandalone } from 'redoc';
import { redocTheme } from './Utils/redocTheme';

// If env var is set, initialize google analytics
if (process.env.GOOGLE_ANALYTICS_KEY) {
  ReactGA.initialize(process.env.GOOGLE_ANALYTICS_KEY);
}

const App = () => {
  // Set up google analytics (if enabled) to only share the page path (does not include names of local files)
  const location = useLocation();
  useEffect(() => {
    if (process.env.GOOGLE_ANALYTICS_KEY) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search + location.hash, // Note- we make sure to not include local file names in the urls, so they wont get sent to google analytics
        page_search: location.search,
        page_hash: location.hash,
      });
    }
  }, [location]);

  return (
    <div>
      <Row style={{ marginTop: '10px' }}>
        <Col md="4"></Col>
        <Col md="4" style={{ textAlign: 'center' }}>
          <a href="/">
            <img src="/IQEngine.svg" alt="IQEngine" />
          </a>
        </Col>
        <Col md="4">
          <Navbar variant="dark">
            <Container className="nav justify-content-end" style={{ whiteSpace: 'nowrap' }}>
              <Nav.Link href="/about" style={{ fontSize: '24px', paddingLeft: '0px', paddingRight: '25px' }}>
                About
              </Nav.Link>
              <Nav.Link href="/plugins" style={{ fontSize: '24px', paddingLeft: '0px', paddingRight: '30px' }}>
                Plugins
              </Nav.Link>
              <a
                className="nav-link"
                style={{ fontSize: '24px', paddingLeft: '0px', paddingRight: '0px' }}
                target="_blank"
                rel="noreferrer"
                href="https://github.com/iqengine/iqengine"
              >
                <img src="/github.svg" style={{ width: '22px' }} alt="GitHub" />
                GitHub
              </a>
            </Container>
          </Navbar>
        </Col>
      </Row>

      <Routes>
        <Route path="/about" element={<About />} />
        <Route path="/siggen" element={<SignalGenerator />} />
        <Route path="/plugins" element={<Plugins />} />
        <Route path="/openapi" element={<RedocStandalone 
          options={{
            disableSidebar: false,
            theme: redocTheme,
            hideDownloadButton: true,
          }}
           specUrl="https://raw.githubusercontent.com/IQEngine/IQEngine/3bbbb60a1bd78c16a87ed1c3ce86adc367cb19b5/detectors/openapi.yaml" />} />
        <Route exact path="/" element={<RepoBrowserContainer />} />
        <Route path="/recordings/spectrogram/:recording" element={<SpectrogramContainer />} />
        <Route path="/recordings/:accountName?/:containerName?/:sasToken?" element={<RecordingsListContainer />} />
      </Routes>

      {/* TODO Figure out how to use mailerlites embedded form*/}
      <div className="container">
        <Row style={{ marginTop: '30px', marginBottom: '30px' }}>
          <a
            target="_blank"
            rel="noreferrer"
            href="https://dashboard.mailerlite.com/forms/299501/77960409531811734/share"
          >
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
