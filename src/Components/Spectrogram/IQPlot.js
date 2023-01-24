// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import Plot from 'react-plotly.js';
import React, { useEffect, useState } from 'react';
import { template } from '../../Utils/plotlyTemplate';

export const IQPlot = (props) => {
  let { currentSamples } = props;
  const [I, setI] = useState();
  const [Q, setQ] = useState();

  useEffect(() => {
    if (currentSamples && currentSamples.length > 0) {
      // For now just show the first 1000 IQ samples, else it's too busy
      const tempCurrentSamples = currentSamples.slice(0, 2000);

      setI(
        tempCurrentSamples.filter((element, index) => {
          return index % 2 === 0;
        })
      );

      setQ(
        tempCurrentSamples.filter((element, index) => {
          return index % 2 === 1;
        })
      );
    }
  }, [currentSamples]); // TODO make sure this isnt going to be sluggish when currentSamples is huge

  return (
    <div>
      <Plot
        data={[
          {
            x: I,
            y: Q,
            type: 'scatter',
            mode: 'markers',
          },
        ]}
        layout={{
          title: 'IQ Plot',
          width: 700,
          height: 600,
          dragmode: 'pan',
          template: template,
          xaxis: {
            title: 'I',
          },
          yaxis: {
            title: 'Q',
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
