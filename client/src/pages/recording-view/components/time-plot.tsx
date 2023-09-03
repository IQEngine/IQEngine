// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import Plot from 'react-plotly.js';
import React, { useEffect, useState } from 'react';
import { template } from '@/utils/plotlyTemplate';
import { useSpectrogramContext } from '../hooks/use-spectrogram-context';

interface TimePlotProps {
  displayedIQ: Float32Array;
}

export const TimePlot = ({ displayedIQ }: TimePlotProps) => {
  const { spectrogramWidth, spectrogramHeight } = useSpectrogramContext();
  const [I, setI] = useState<Float32Array>();
  const [Q, setQ] = useState<Float32Array>();

  useEffect(() => {
    if (displayedIQ && displayedIQ.length > 0) {
      setI(
        displayedIQ.filter((element, index) => {
          return index % 2 === 0;
        })
      );

      setQ(
        displayedIQ.filter((element, index) => {
          return index % 2 === 1;
        })
      );
    }
  }, [displayedIQ]); // TODO make sure this isnt going to be sluggish when the number of samples is huge


  return (
    <div className="px-3">
      <p className="text-primary text-center">Below shows the time domain of the sample range displayed on the spectrogram tab</p>
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
          width: spectrogramWidth,
          height: spectrogramHeight,
          margin: {
            l: 0,
            r: 0,
            b: 0,
            t: 0,
            pad: 0
          },
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
