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
                <li class="list-group-item">- RFML</li>
                <li class="list-group-item">- Wireless CTFs</li>
                <li class="list-group-item">- SIGINT</li>
              </ul>
            </div>
          </Col>
          <Col xs={4}>
            <ul style={{ padding: '10px', fontSize: '25px' }}>
              <li class="list-group-item">- Spectrum Awareness</li>
              <li class="list-group-item">- Debugging</li>
              <li class="list-group-item">- SDR/DSP/Wireless Students</li>
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
                <li class="list-group-item">- Analyze RF recordings</li>
                <li class="list-group-item">- Organize lots of RF recordings</li>
                <li class="list-group-item">- Test signal detection/classification algorithms and share them easily</li>
              </ul>
            </div>
          </Col>
          <Col xs={5}>
            <ul style={{ padding: '10px', fontSize: '25px' }}>
              <li class="list-group-item">
                - Share RF recordings/datasets with others, without them having to download files or install software
              </li>
              <li class="list-group-item">- Learn DSP basics (e.g., FFTs, filtering, wavelets)</li>
              <li class="list-group-item">- Run a local instance of IQEngine for sensitive data</li>
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
              Leadership Team
            </h1>
          </center>
        </Row>
        <Row style={{ marginBottom: '15px', paddingBottom: '15px', fontSize: '20px' }}>
          <center>IQEngine is a community effort, lead by the following individuals (and seeking more!):</center>
        </Row>
        <Row style={{ marginBottom: '15px', paddingBottom: '15px', fontSize: '20px' }}>
          <Col></Col>
          <Col>
            <center>
              <img style={{ width: '50%' }} src="./Marc.png" alt="marc"></img>
              <p></p>
              Marc
            </center>
          </Col>
          <Col>
            <center>
              <img style={{ width: '50%' }} src="./Maheen.png" alt="maheen"></img>
              <p></p>
              Maheen
            </center>
          </Col>
          <Col>
            <center>
              <img style={{ width: '50%' }} src="./Luke.png" alt="luke avatar"></img>
              <p></p>
              Luke
            </center>
          </Col>
          <Col></Col>
        </Row>
        <Row style={{ marginBottom: '15px', fontSize: '20px' }}>
          <Col></Col>
          <Col>
            <center>
              <h4>Ways to get Involved:</h4>
            </center>
            <ul>
              <li>
                Join the <a href="https://discord.gg/bHbYJWFT">IQEngine Discord</a>
              </li>
              <li>Post GitHub Issues/PRs</li>
              <li>Email Marc questions/comments about IQEngine - iqengine@vt.edu</li>
            </ul>
          </Col>
          <Col></Col>
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
                <p></p> Implementation of IQEngine began during a 1-week internal hackathon at Microsoft, where Marc and
                several of his SDR coworkers built a proof-of-concept prototype. It was open sourced and shown off at
                GNU Radio Conference '22. The first full version was completed in January '23 with help from a group of
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
