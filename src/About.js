// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import { Card } from 'react-bootstrap';
import { CardContent } from '@mui/material';

const styleMargins = {
  marginTop: 20,
  marginBottom: 20,
};

export const About = () => {
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
              Great For...
            </h1>
          </center>
          <Col xs={3}></Col>
          <Col xs={3}>
            <div className="container">
              <ul style={{ padding: '10px', fontSize: '25px' }}>
                <li className="list-group-item">- RFML</li>
                <li className="list-group-item">- Wireless CTFs</li>
                <li className="list-group-item">- SIGINT</li>
              </ul>
            </div>
          </Col>
          <Col xs={4}>
            <ul style={{ padding: '10px', fontSize: '25px' }}>
              <li className="list-group-item">- Spectrum Awareness</li>
              <li className="list-group-item">- Debugging</li>
              <li className="list-group-item">- SDR/DSP/Wireless Students</li>
            </ul>
          </Col>
          <Col xs={2}></Col>
        </Row>
      </div>

      <div style={{ width: 'auto' }}>
        <Row style={{ styleMargins }}>
          <center>
            <h1
              style={{
                color: '#04b889',
                fontWeight: 'bold',
                marginTop: '20px',
                marginBottom: '10px',
              }}
            >
              Example Use-Cases
            </h1>
          </center>
          <Col xs={1}></Col>
          <Col xs={5}>
            <div className="container">
              <ul style={{ padding: '10px', fontSize: '25px' }}>
                <li className="list-group-item">- Analyze RF recordings</li>
                <li className="list-group-item">- Organize lots of RF recordings</li>
                <li className="list-group-item">
                  - Test signal detection/classification algorithms and share them easily
                </li>
              </ul>
            </div>
          </Col>
          <Col xs={5}>
            <ul style={{ padding: '10px', fontSize: '25px' }}>
              <li className="list-group-item">
                - Share RF recordings/datasets with others, without them having to download files or install software
              </li>
              <li className="list-group-item">- Learn DSP basics (e.g., FFTs, filtering, wavelets)</li>
              <li className="list-group-item">- Run a local instance of IQEngine for sensitive data</li>
            </ul>
          </Col>
          <Col xs={1}></Col>
        </Row>
      </div>

      <div style={{ backgroundColor: '#303030', width: 'auto', paddingBottom: '15px' }}>
        <Row>
          <center>
            <h1
              style={{
                color: '#04b889',
                fontWeight: 'bold',
                marginTop: '50px',
                marginBottom: '50px',
              }}
            >
              Leadership Teams
            </h1>
          </center>
        </Row>

        <Row className="mt-0 mb-5">
          <Col xs={2}></Col>
          <Col className="ms-0 me-5">
            <Card>
              <Card.Header className="leadership-card-header">Core Leadership</Card.Header>
              <Card.Body className="leadership-card-body">
                Manages the overall direction of IQEngine<br></br>
                <br></br>
                Team Lead: Marc Lichtman
              </Card.Body>
            </Card>
          </Col>
          <Col className="ms-5 me-5">
            <Card>
              <Card.Header className="leadership-card-header">Frontend – Functionality</Card.Header>
              <Card.Body className="leadership-card-body">
                The IQEngine frontend <br></br>
                <br></br>
                Team Lead: Maheen
              </Card.Body>
            </Card>
          </Col>
          <Col className="ms-5 me-0">
            <Card>
              <Card.Header className="leadership-card-header">Frontend - User Experience</Card.Header>
              <Card.Body className="leadership-card-body">
                UX design and surveying <br></br>
                <br></br>
                Team Lead: Luke/Robotastic
              </Card.Body>
            </Card>
          </Col>
          <Col xs={2}></Col>
        </Row>

        <Row className="mt-5 mb-5">
          <Col xs={2}></Col>
          <Col className="ms-0 me-5">
            <Card>
              <Card.Header className="leadership-card-header">Backend/Plugins</Card.Header>
              <Card.Body className="leadership-card-body">
                Backend design including plugin API and implementation <br></br>
                <br></br>
                Team Lead: Eric
              </Card.Body>
            </Card>
          </Col>
          <Col className="ms-5 me-5">
            <Card>
              <Card.Header className="leadership-card-header">Education-Oriented Features</Card.Header>
              <Card.Body className="leadership-card-body">
                Making IQEngine the perfect place for students <br></br>
                <br></br>
                Team Lead: Seeking Volunteer!
              </Card.Body>
            </Card>
          </Col>
          <Col className="ms-5 me-0">
            <Card>
              <Card.Header className="leadership-card-header">RFML</Card.Header>
              <Card.Body className="leadership-card-body">
                RF Machine Learning oriented functionality <br></br>
                <br></br>
                Team Lead: Clay
              </Card.Body>
            </Card>
          </Col>
          <Col xs={2}></Col>
        </Row>

        <Row className="mt-5 mb-5">
          <Col xs={2}></Col>
          <Col className="ms-0 me-5">
            <Card>
              <Card.Header className="leadership-card-header">Community</Card.Header>
              <Card.Body className="leadership-card-body">
                Manages the Discord and other community engagements <br></br>
                <br></br>
                Team Lead: Jumbotron
              </Card.Body>
            </Card>
          </Col>
          <Col className="ms-5 me-5">
            <Card>
              <Card.Header className="leadership-card-header">SigMF Integration</Card.Header>
              <Card.Body className="leadership-card-body">
                Expanding and verifying IQEngine's use of SigMF <br></br>
                <br></br>
                Team Lead: Marc Lichtman
              </Card.Body>
            </Card>
          </Col>
          <Col className="ms-5 me-0">
            <Card>
              <Card.Header className="leadership-card-header">Maps Interface</Card.Header>
              <Card.Body className="leadership-card-body">
                The IQEngine Maps interface (coming soon!) <br></br>
                <br></br>
                Team Lead: TBD
              </Card.Body>
            </Card>
          </Col>
          <Col xs={2}></Col>
        </Row>

        <Row style={{ marginBottom: '15px', paddingBottom: '15px', fontSize: '20px' }}>
          <center>IQEngine is a community effort, lead by the above individuals (and seeking more!):</center>
        </Row>

        <Row style={{ marginBottom: '15px', fontSize: '20px' }}>
          <Col xs={3}></Col>
          <Col>
            <center>
              <h4>Ways to get Involved:</h4>
            </center>
            <ul>
              <li>
                Join the <a href="https://discord.gg/k7C8kp3b76">IQEngine Discord</a>
              </li>
              <li>Post GitHub Issues/PRs</li>
              <li>Email questions/comments about IQEngine to iqengine@vt.edu</li>
            </ul>
          </Col>
          <Col xs={3}></Col>
        </Row>
      </div>

      <div style={{}}>
        <Row>
          <Col>
            <center>
              <h1
                style={{
                  color: '#04b889',
                  fontWeight: 'bold',
                  marginTop: '20px',
                }}
              >
                Origin
              </h1>
              <p style={{ padding: '10px', fontSize: '20px' }}>
                The idea for a web-based spectrogram tool started while Marc was teaching an SDR course at UMD, with
                students who had varying OS's; some ran into trouble installing existing SDR desktop apps. By removing
                the software installation barrier, SDR/DSP tooling, and education, could be made more accessible. Next
                came several ideas for SigMF-centric features beyond what existing software provided, such as the
                ability to organize hundreds of recordings or visually edit annotations.
                <br></br>
                <br></br>
                Implementation of IQEngine began during a 1-week internal hackathon at Microsoft, where Marc and several
                of his SDR coworkers built a proof-of-concept prototype. It was open sourced and shown off at GNU Radio
                Conference '22. The first full version was completed in January '23 with help from a group of
                undergraduate "sprinterns" at Microsoft, consisting of students from UMD and GMU that were part of the
                Break Through Tech program.
              </p>
            </center>
          </Col>
        </Row>

        <Row style={{ marginBottom: '15px' }}>
          <center>
            <img style={{ width: '30%' }} alt="sprintern" src="./sprinterns.jpeg"></img>
            <p></p>
            Winter '23 Sprinterns from UMD and GMU
          </center>
        </Row>
      </div>
      <div style={{ backgroundColor: '#303030', width: 'auto' }}>
        <Row style={{ paddingTop: '30px' }}></Row>
      </div>
    </div>
  );
};
