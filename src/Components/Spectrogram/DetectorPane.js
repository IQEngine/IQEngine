// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState } from 'react';
import { DETECTOR_ENDPOINT } from '../../Utils/constants';

export const DetectorPane = (props) => {
  let { meta, handleMeta, cursorsEnabled, handleProcessTime } = props;

  const [detectorName, setDetectorName] = useState('markos_detector');

  const handleChangeDetector = (e) => {
    setDetectorName(e.target.value);
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
    const len = trimmedSamples.length;
    var newSamps = new Array(len);
    for (let i = 0; i < len; i = i + 1) {
      newSamps[i] = trimmedSamples[i]; // might want to do some math on ints here
    }

    fetch(DETECTOR_ENDPOINT + detectorName, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        samples: newSamps,
        sample_rate: sampleRate,
        center_freq: freq,
        detector_settings: {},
      }),
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

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Detector:
        <select value={detectorName} onChange={handleChangeDetector}>
          <option value="markos_detector">markos_detector</option>
          <option value="placeholder1">placeholder1</option>
          <option value="placeholder2">placeholder2</option>
        </select>
      </label>
      <input type="submit" value="Submit" />
    </form>
  );
};
