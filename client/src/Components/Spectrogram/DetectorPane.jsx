// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { GetConfigInstance } from '../../Config';

export const DetectorPane = (props) => {
  let { meta, handleMeta, cursorsEnabled, handleProcessTime } = props;

  const [detectorList, setDetectorList] = useState([]);
  const [selectedDetector, setSelectedDetector] = useState('default');
  const [detectorParams, setDetectorParams] = useState({});
  const [value, setValue] = useState(0); // integer state used to force rerender
  // if (!config.detectorEndpoint) {
  //   detectorEndpoint = 'http://127.0.0.1:8000/detectors/';
  // }
  // on component load perform a GET on /detectors to get list of detectors
  useEffect(() => {
    (async () => {
      let config = await GetConfigInstance();
      // In local mode, CONNECTION_INFO isn't defined
      if (config.detectorEndpoint) {
        detectorEndpoint = config.detectorEndpoint;
      } else {
        detectorEndpoint = 'http://127.0.0.1:8000/detectors/';
      }
      fetch(detectorEndpoint, { method: 'GET' })
        .then(function (response) {
          return response.json();
        })
        .then(function (data) {
          console.log('Detectors:', data);
          setDetectorList(data);
        })
        .catch((error) => {
          console.log(error);
        });
    })();
  }, []);

  const handleChangeDetector = (e) => {
    setSelectedDetector(e.target.value);
    setDetectorParams({}); // in case something goes wrong
    // Fetch the custom params for this detector
    fetch(detectorEndpoint + e.target.value, { method: 'GET' })
      .then(function (response) {
        if (response.status === 404) {
          return {};
        }
        return response.json();
      })
      .then(function (data) {
        console.log('Detector Params:', data);
        setDetectorParams(data);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!cursorsEnabled) {
      alert('First enable cursors and choose a region of time to run the detector on');
      return;
    }

    // this does the tile calc and gets the right samples in currentSamples
    const { trimmedSamples, startSampleOffset } = handleProcessTime();

    const sampleRate = meta['global']['core:sample_rate'];
    const freq = meta['captures'][0]['core:frequency'];

    // We can only send normal Arrays over JSON for some reason, so convert it
    const newSamps = Array.from(trimmedSamples);

    let body = {
      samples: newSamps,
      sample_rate: sampleRate,
      center_freq: freq,
    };
    // Add custom params
    for (const [key, value] of Object.entries(detectorParams)) {
      if (value['type'] === 'integer') {
        body[key] = parseInt(value['default']); // remember, we updated default with whatever the user enters
      } else if (value['type'] === 'number') {
        body[key] = parseFloat(value['default']);
      } else {
        body[key] = value['default'];
      }
    }
    console.log(body);

    fetch(detectorEndpoint + selectedDetector, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        console.log('Detector Status:', data.status);
        console.log('Results:', data.annotations);
        for (let i = 0; i < data.annotations.length; i++) {
          data.annotations[i]['core:sample_start'] += startSampleOffset;
        }
        handleMeta(data.annotations); // update the annotations stored in meta state in SpectrogramPage
      });
  };

  const handleChange = (e) => {
    detectorParams[e.target.name]['default'] = e.target.value; // the schema uses default so we'll just replace it with the new value
    setDetectorParams(detectorParams);
    setValue((value) => value + 1); // update state to force render
  };

  return (
    <Form className="detectForm" controlid="detectFormId" onSubmit={handleSubmit}>
      <Form.Label>Detector:</Form.Label>
      <select value={selectedDetector} onChange={handleChangeDetector}>
        <option disabled value="default">
          Select a Detector
        </option>
        {detectorList.map((detectorName, index) => (
          <option key={index} value={detectorName}>
            {detectorName}
          </option>
        ))}
      </select>
      {Object.keys(detectorParams).length > 0 && (
        <>
          <Form.Label>Params:</Form.Label>
          <br></br>{' '}
          <Form.Group className="mb-3">
            {Object.keys(detectorParams).map((key, index) => (
              <Form.Label key={index}>
                {detectorParams[key]['title']} - {detectorParams[key]['type']}
                <Form.Control
                  type="text"
                  name={key}
                  value={detectorParams[key]['default']}
                  onChange={handleChange}
                  className="form-control"
                />
              </Form.Label>
            ))}
          </Form.Group>
          <Button type="submit" variant="primary">
            Run Detector
          </Button>
        </>
      )}
    </Form>
  );
};
