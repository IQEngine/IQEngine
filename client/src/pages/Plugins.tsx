// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';

export const Plugins = () => {
  return (
    <div>
      <div style={{ width: 'auto' }}>
        <h1 className="text-primary text-center">Plugins Concept</h1>
        <p className="text-center text-lg mx-56">
          Through an optional backend API, IQEngine supports various plugins, such as:
        </p>
        <ul className="list-disc text-lg mx-72 my-4">
          <li>
            A signal detector (with optional classifier) can be triggered in the main spectrogram page, which displays
            the output in the form of SigMF annotations, convinient for testing new detection/classification algorithms
            - <a href="openapi">Link to our OpenAPI Spec</a>
          </li>
          <li>Signal demodulators/decoders that take in IQ and output bytes, imagery, audio, etc</li>
          <li>
            Other DSP modules letting you perform a variety of signal processing functions and other IQ sample
            manipulation
          </li>
        </ul>
        <p className="text-lg mx-56 mb-3">Current concept plan:</p>
        <center>
          <img
            src="./plugins_concept.svg"
            className="w-1/2 border-accent border-1 shadow-md shadow-tertiary mb-3"
            alt="plugins concept"
          ></img>
        </center>
      </div>
    </div>
  );
};
