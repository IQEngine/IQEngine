// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import Plot from 'react-plotly.js';
import React, { useEffect, useState } from 'react';
import { template } from '@/utils/plotlyTemplate';

export const TimePlot = (props) => {
  let { currentSamples, plotWidth, plotHeight } = props;
  const [I, setI] = useState();
  const [Q, setQ] = useState();

  useEffect(() => {
    if (currentSamples && currentSamples.length > 0) {
      setI(
        currentSamples.filter((element, index) => {
          return index % 2 === 0;
        })
      );

      setQ(
        currentSamples.filter((element, index) => {
          return index % 2 === 1;
        })
      );
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
    <div className="px-3">
      <Plot
        data={[
          {
            y: I,
            type: 'scatter',
            name: 'I',
          },
          {
            y: Q,
            type: 'scatter',
            name: 'Q',
          },
        ]}
        layout={{
          width: plotWidth,
          height: plotHeight,
          dragmode: 'pan',
          showlegend: true,
          template: template,
          xaxis: {
            title: 'Time',
            rangeslider: { range: [0, 1000] },
          },
          yaxis: {
            title: 'Samples',
            fixedrange: true,
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
