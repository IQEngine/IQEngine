import Plot from 'react-plotly.js';
import React, { useEffect, useState } from 'react';
import { template } from '@/utils/plotlyTemplate';
import { useSpectrogramContext } from '../hooks/use-spectrogram-context';
import { useCursorContext } from '../hooks/use-cursor-context';

interface IQPlotProps {
  displayedIQ: Float32Array;
  fftStepSize: Number;
}

export const IQPlot = ({ displayedIQ, fftStepSize }: IQPlotProps) => {
  const { spectrogramWidth, spectrogramHeight, freqShift } = useSpectrogramContext();
  const { cursorFreqShift } = useCursorContext(); // cursorFreqShift is in normalized freq (-0.5 to +0.5) regardless of if display RF is on
  const [I, setI] = useState<Float32Array>();
  const [Q, setQ] = useState<Float32Array>();

  useEffect(() => {
    if (displayedIQ && displayedIQ.length > 0) {
      // For now just show the first 1000 IQ samples, else it's too busy and it crashes the plot
      const displayedIQ_subset = displayedIQ.slice(0, 2000);

      const temp_I = new Float32Array(displayedIQ_subset.length / 2);
      const temp_Q = new Float32Array(displayedIQ_subset.length / 2);
      for (let i = 0; i < displayedIQ_subset.length / 2; i++) {
        if (freqShift) {
          // Multiplying two complex numbers: (a + ib)(c + id) = (ac - bd) + i(ad + bc).
          temp_I[i] =
            displayedIQ_subset[i * 2] * Math.cos(-2 * Math.PI * cursorFreqShift * i) -
            displayedIQ_subset[i * 2 + 1] * Math.sin(-2 * Math.PI * cursorFreqShift * i);
          temp_Q[i] =
            displayedIQ_subset[i * 2] * Math.sin(-2 * Math.PI * cursorFreqShift * i) +
            displayedIQ_subset[i * 2 + 1] * Math.cos(-2 * Math.PI * cursorFreqShift * i);
        } else {
          temp_I[i] = displayedIQ_subset[i * 2];
          temp_Q[i] = displayedIQ_subset[i * 2 + 1];
        }
      }
      setI(temp_I);
      setQ(temp_Q);
    }
  }, [displayedIQ, freqShift]);

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
            uirevision: 'true', // keeps zoom/pan the same when data changes
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
