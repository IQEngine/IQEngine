// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import Plot from 'react-plotly.js';
import React, { useEffect, useState, setState } from 'react';
import { template } from '../../Utils/plotlyTemplate';

export const TimePlot = (props) => {
  let { currentSamples } = props;
  const [I, setI] = useState();
  const [Q, setQ] = useState();
  const [plot, setPlot] = useState(null);

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

  // Should only happen once when page loads
  useEffect(() => {
    const options = {};
    const tempPlot = new window.sigplot.Plot(document.getElementById('timePlot'), options);

    var data = currentSamples; // the series of y-values
    var data_header = {
      xunits: 'Time',
      //xstart: 100, // the start of the x-axis
      xdelta: 1e-6, // TODO: USE SAMPLE RATE. the x-axis step between each data point
      yunits: 'Sample',
    };
    var layer_options = {
      name: 'I',
    };
    tempPlot.overlay_array(data, data_header, layer_options);

    setPlot(tempPlot);
  }, [currentSamples]);

  useEffect(() => {
    if (plot) {
    }
  }, [currentSamples]);

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
          title: 'Time Domain Plot',
          width: 700,
          height: 600,
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

      <div style={{ width: '600px', height: '400px' }} id="timePlot"></div>
    </div>
  );
};
