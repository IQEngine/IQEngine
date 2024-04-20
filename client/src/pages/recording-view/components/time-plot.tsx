import Plot from 'react-plotly.js';
import React, { useEffect, useState } from 'react';
import { template } from '@/utils/plotlyTemplate';
import { useSpectrogramContext } from '../hooks/use-spectrogram-context';

interface TimePlotProps {
  displayedIQ: Float32Array;
  fftStepSize: Number;
}

export const TimePlot = ({ displayedIQ, fftStepSize }: TimePlotProps) => {
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
      <p className="text-primary text-center">
        Below shows the time domain of the sample range displayed on the spectrogram tab
      </p>
      {fftStepSize === 0 ? (
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
              pad: 0,
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
      ) : (
        <>
          <h1 className="text-center">Plot only visible when Zoom Out Level is minimum (0)</h1>
          <p className="text-primary text-center mb-6">(Otherwise the IQ samples are not contiguous)</p>
        </>
      )}
    </div>
  );
};
