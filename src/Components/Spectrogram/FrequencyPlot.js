// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import Plot from 'react-plotly.js';
import React, { useEffect, useState } from 'react';
import { fftshift } from 'fftshift';
import { template } from '../../Utils/plotlyTemplate';

const FFT = require('fft.js');

export const FrequencyPlot = (props) => {
  let { currentSamples } = props;
  const [magnitudes, setMagnitudes] = useState();

  useEffect(() => {
    if (currentSamples && currentSamples.length > 0) {
      // Calc PSD
      const fft_size = Math.pow(2, Math.floor(Math.log2(currentSamples.length / 2)));
      const f = new FFT(fft_size);
      const out = f.createComplexArray(); // creates an empty array the length of fft.size*2
      f.transform(out, currentSamples.slice(0, fft_size * 2)); // assumes input (2nd arg) is in form IQIQIQIQ and twice the length of fft.size
      let mags = new Array(out.length / 2);
      for (let j = 0; j < out.length / 2; j++) {
        mags[j] = Math.sqrt(Math.pow(out[j * 2], 2) + Math.pow(out[j * 2 + 1], 2)); // take magnitude
      }
      fftshift(mags); // in-place
      mags = mags.map((x) => 10.0 * Math.log10(x));
      setMagnitudes(mags);
    }
  }, [currentSamples]); // TODO make sure this isnt going to be sluggish when currentSamples is huge

  if (!props.cursorsEnabled) {
    return (
      <div>
        <p>Please enable cursors first</p>
      </div>
    );
  }

  return (
    <div>
      <Plot
        data={[
          {
            y: magnitudes,
            type: 'scatter',
          },
        ]}
        layout={{
          title: 'Frequency Domain Plot',
          width: 700,
          height: 600,
          dragmode: 'pan',
          template: template,
          xaxis: {
            title: 'Frequency',
            //range: [0, 100],
            rangeslider: { range: [0, 100] },
          },
          yaxis: {
            title: 'Magnitude',
            fixedrange: false,
          },
        }}
        config={{
          displayModeBar: true,
          scrollZoom: true,
        }}
      />
    </div>
  );
};
