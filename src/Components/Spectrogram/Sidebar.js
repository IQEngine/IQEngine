// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import { Nav } from 'react-bootstrap';
import SettingsPane from './SettingsPane';
import { DetectorPane } from './DetectorPane';
import InfoPane from './InfoPane';
import Accordion from 'react-bootstrap/Accordion';

const Sidebar = (props) => {
  //from: https://stackoverflow.com/questions/60482018/make-a-sidebar-from-react-bootstrap
  return (
    <Nav className="d-flex flex-column align-items-center align-items-sm-start px-3 pt-2">
      <Nav.Item>
        <Accordion defaultActiveKey="0">
          <Accordion.Item eventKey="0">
            <Accordion.Header>Settings</Accordion.Header>
            <Accordion.Body>
              <SettingsPane
                updateBlobTaps={props.updateBlobTaps}
                updateMagnitudeMax={props.updateMagnitudeMax}
                updateMagnitudeMin={props.updateMagnitudeMin}
                updateFftsize={props.updateFftsize}
                updateWindowChange={props.updateWindowChange}
                meta={props.meta}
                handleAutoScale={props.handleAutoScale}
                autoscale={props.autoscale}
                magnitudeMax={props.fft.magnitudeMax}
                magnitudeMin={props.fft.magnitudeMin}
              />
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="1">
            <Accordion.Header>Detector</Accordion.Header>
            <Accordion.Body>
              <DetectorPane
                meta={props.meta}
                handleMeta={props.handleMeta}
                cursorsEnabled={props.cursorsEnabled}
                handleProcessTime={props.handleProcessTime}
              />
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="2">
            <Accordion.Header>Info</Accordion.Header>
            <Accordion.Body>
              <InfoPane meta={props.meta} handleMetaGlobal={props.handleMetaGlobal} />
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="3">
            <Accordion.Header>Annotations</Accordion.Header>
            <Accordion.Body></Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Nav.Item>
    </Nav>
  );
};

export { Sidebar };
