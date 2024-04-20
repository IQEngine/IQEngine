// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import Plot from 'react-plotly.js';
import React, { useEffect, useState } from 'react';
import { template } from '@/utils/plotlyTemplate';
import { useSpectrogramContext } from '../hooks/use-spectrogram-context';

interface IQPlotProps {
  displayedIQ: Float32Array;
  fftStepSize: Number;
}

export const IQPlot = ({ displayedIQ, fftStepSize }: IQPlotProps) => {
  const { spectrogramWidth, spectrogramHeight } = useSpectrogramContext();
  const [I, setI] = useState<Float32Array>();
  const [Q, setQ] = useState<Float32Array>();

  useEffect(() => {
    if (displayedIQ && displayedIQ.length > 0) {
      // For now just show the first 1000 IQ samples, else it's too busy
      const tempCurrentSamples = displayedIQ.slice(0, 2000);

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
  }, [displayedIQ]); // TODO make sure this isnt going to be sluggish when currentSamples is huge

  return (
    <div className="px-3">
      <p className="text-primary text-center">Below shows the first 1000 IQ samples displayed on the spectrogram tab</p>
      {fftStepSize === 0 ? (
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
            width: spectrogramHeight,
            height: spectrogramHeight, // so it's square
            margin: {
              l: 0,
              r: 0,
              b: 0,
              t: 0,
              pad: 0,
            },
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
      ) : (
        <>
          <h1 className="text-center">Plot only visible when Zoom Out Level is minimum (0)</h1>
          <p className="text-primary text-center mb-6">(Otherwise the IQ samples are not contiguous)</p>
        </>
      )}
    </div>
  );
};
