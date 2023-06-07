// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect } from 'react';
import { configQuery } from '../../api/config/queries';
import { useAppDispatch } from '@/Store/hooks';
import { Annotation, SigMFMetadata } from '@/Utils/sigmfMetadata';
import { matchPath } from 'react-router-dom';

export interface DetectorPaneProps {
  cursorsEnabled: boolean;
  handleProcessTime: () => { trimmedSamples: number[]; startSampleOffset: number };
  meta: SigMFMetadata;
  setMeta: (meta: SigMFMetadata) => void;
}

export const DetectorPane = ({ cursorsEnabled, handleProcessTime, meta, setMeta }: DetectorPaneProps) => {
  const [detectorList, setDetectorList] = useState([]);
  const [selectedDetector, setSelectedDetector] = useState('default');
  const [detectorParams, setDetectorParams] = useState({});
  const [value, setValue] = useState(0); // integer state used to force rerender
  const dispatch = useAppDispatch();
  const config = configQuery();
  useEffect(() => {
    if (!config.data || !config.data.detectorEndpoint) return;
    let detectorEndpoint = 'http://127.0.0.1:8000/detectors/';
    // In local mode, CONNECTION_INFO isn't defined
    if (config.data.detectorEndpoint) {
      detectorEndpoint = config.data.detectorEndpoint;
    }
    fetch(detectorEndpoint, { method: 'GET' })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        console.debug('Detectors:', data);
        setDetectorList(data);
      })
      .catch((error) => {
        console.debug(error);
      });
  }, [config?.data?.detectorEndpoint]);

  const handleChangeDetector = (e) => {
    if (!config.data || !config.data.detectorEndpoint) return;
    setSelectedDetector(e.target.value);
    setDetectorParams({}); // in case something goes wrong
    // Fetch the custom params for this detector
    fetch(config.data.detectorEndpoint + e.target.value, { method: 'GET' })
      .then(function (response) {
        if (response.status === 404) {
          return {};
        }
        return response.json();
      })
      .then(function (data) {
        console.debug('Detector Params:', data);
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
    console.debug(body);

    fetch(config.data.detectorEndpoint + selectedDetector, {
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
        console.debug('Detector Status:', data.status);
        console.debug('Results:', data.annotations);
        for (let i = 0; i < data.annotations.length; i++) {
          data.annotations[i]['core:sample_start'] += startSampleOffset;
        }
        let newAnnotations = data.annotations.map((annotation) => Object.assign(new Annotation(), annotation));
        console.log(newAnnotations);
        meta['annotations'].push(...newAnnotations);
        meta['annotations'] = meta['annotations'].flat();
        let newMeta = Object.assign(new SigMFMetadata(), meta);
        setMeta(newMeta);
      });
  };

  const handleChange = (e) => {
    detectorParams[e.target.name]['default'] = e.target.value; // the schema uses default so we'll just replace it with the new value
    setDetectorParams(detectorParams);
    setValue((value) => value + 1); // update state to force render
  };

  return (
    <div className="detectForm" id="detectFormId" onSubmit={handleSubmit}>
      <label className="label">
        Detector:
        <select
          className="rounded bg-base-content text-base-100"
          value={selectedDetector}
          onChange={handleChangeDetector}
        >
          <option disabled value="default">
            Select a Detector
          </option>
          {detectorList.map((detectorName, index) => (
            <option key={index} value={detectorName}>
              {detectorName}
            </option>
          ))}
        </select>
      </label>
      {Object.keys(detectorParams).length > 0 && (
        <>
          <label className="label">Params:</label>
          <div className="mb-3">
            {Object.keys(detectorParams).map((key, index) => (
              <>
                <label className="label" key={index}>
                  {detectorParams[key]['title']}
                </label>
                <input
                  type={detectorParams[key]['type']}
                  name={key}
                  value={detectorParams[key]['default']}
                  onChange={handleChange}
                  className="h-8 rounded text-base-100 ml-1 pl-2"
                />
              </>
            ))}
          </div>
          <button type="submit" className="btn btn-primary" onClick={handleSubmit}>
            Run Detector
          </button>
        </>
      )}
    </div>
  );
};
