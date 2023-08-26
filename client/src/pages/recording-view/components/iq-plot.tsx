// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import Plot from 'react-plotly.js';
import React, { useEffect, useState } from 'react';
import { template } from '@/utils/plotlyTemplate';
import { useCursorContext } from '../hooks/use-cursor-context';
import { useSpectrogramContext } from '../hooks/use-spectrogram-context';

export const IQPlot = () => {
  const { spectrogramWidth, spectrogramHeight } = useSpectrogramContext();
  const { cursorData } = useCursorContext();
  const [I, setI] = useState<Float32Array>();
  const [Q, setQ] = useState<Float32Array>();

  useEffect(() => {
    if (cursorData && cursorData.length > 0) {
      // For now just show the first 1000 IQ samples, else it's too busy
      const tempCurrentSamples = cursorData.slice(0, 2000);

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
  }, [cursorData]); // TODO make sure this isnt going to be sluggish when currentSamples is huge

  if (!cursorData || cursorData.length === 0) {
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
            x: I,
            y: Q,
            type: 'scatter',
            mode: 'markers',
          },
        ]}
        layout={{
          width: spectrogramWidth,
          height: spectrogramHeight,
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
