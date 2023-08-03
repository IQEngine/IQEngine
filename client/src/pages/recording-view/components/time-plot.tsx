// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import Plot from 'react-plotly.js';
import React, { useEffect, useState } from 'react';
import { template } from '@/utils/plotlyTemplate';
import { useCursorContext } from '../hooks/use-cursor-context';

export const TimePlot = (props) => {
  let { plotWidth, plotHeight } = props;
  const { cursorData } = useCursorContext();
  const [I, setI] = useState<Float32Array>();
  const [Q, setQ] = useState<Float32Array>();

  useEffect(() => {
    if (cursorData && cursorData.length > 0) {
      setI(
        cursorData.filter((element, index) => {
          return index % 2 === 0;
        })
      );

      setQ(
        cursorData.filter((element, index) => {
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
