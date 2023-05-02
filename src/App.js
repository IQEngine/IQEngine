// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar, Row, Col } from 'react-bootstrap';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import ReactGA from 'react-ga4';
import { Outlet } from 'react-router-dom';
import ThemeSelector from './Components/Styles/ThemeSelector';

// If env var is set, initialize google analytics
if (process.env.GOOGLE_ANALYTICS_KEY) {
  ReactGA.initialize(process.env.GOOGLE_ANALYTICS_KEY);
}

export const App = () => {
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
    <ThemeSelector>
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

                <Nav.Link href="/plugins" style={{ fontSize: '24px', paddingLeft: '0px', paddingRight: '20px' }}>
                  Plugins
                </Nav.Link>

                <a
                  className="nav-link"
                  style={{ fontSize: '24px', paddingLeft: '0px', paddingRight: '20px' }}
                  target="_blank"
                  rel="noreferrer"
                  href="https://discord.gg/k7C8kp3b76"
                >
                  <img src="/discord.svg" style={{ width: '22px' }} alt="GitHub" />
                  Discord
                </a>

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
        <Outlet />
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
    </ThemeSelector>
  );
};

export default App;
