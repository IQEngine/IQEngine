// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect } from 'react';
import { Layer, Rect, Text } from 'react-konva';
import { useSpectrogramContext } from '../hooks/use-spectrogram-context';

const RulerTop = () => {
  const { meta, fftSize, spectrogramWidth, includeRfFreq } = useSpectrogramContext();
  const spectrogramWidthScale = spectrogramWidth / fftSize;
  const [ticks, setTicks] = useState([]);
  const [labels, setLabels] = useState([]);
  const sampleRate = meta.getSampleRate();
  const coreFrequency = meta.getCenterFrequency();

  useEffect(() => {
    const num_ticks = 16;
    const temp_ticks = [];
    const temp_labels = [];
    for (let i = 0; i <= num_ticks; i++) {
      if (i % (num_ticks / 4) === 0) {
        let f = (i / num_ticks) * sampleRate - sampleRate / 2;
        if (includeRfFreq) f = f + coreFrequency;
        f = f / 1e6; // convert to MHz
        let text = f.toString();
        if (f > 1000) {
          let fe = f.toExponential(); // converts to a string
          text = fe.split('e+')[0].slice(0, 6) + 'e' + fe.split('e+')[1]; // quick way to round to N digits and remove the + sign
        }
        if (i == num_ticks) text = text + ' MHz';
        temp_labels.push({
          text: text,
          x: (spectrogramWidth / num_ticks) * i + 3,
          y: 2,
        }); // in ms
        temp_ticks.push({ x: (spectrogramWidth / num_ticks) * i, y: 10, width: 0, height: 15 });
      } else {
        temp_ticks.push({ x: (spectrogramWidth / num_ticks) * i, y: 20, width: 0, height: 5 });
      }
    }
    //console.debug('RulerTop: useEffect', temp_ticks, temp_labels);

    setTicks(temp_ticks);
    setLabels(temp_labels);
  }, [spectrogramWidth, sampleRate, spectrogramWidthScale, includeRfFreq]);

  if (ticks.length > 1) {
    return (
      <Layer>
        {ticks.map((tick, index) => (
          // couldnt get Line to work, kept getting NaN errors, so just using Rect instead
          <Rect
            x={tick.x}
            y={tick.y}
            width={tick.width}
            height={tick.height}
            fillEnabled={false}
            stroke="white"
            strokeWidth={1}
            key={index}
          />
        ))}
        {labels.map((label, index) => (
          // for Text params see https://konvajs.org/api/Konva.Text.html
          <Text
            text={label.text}
            fontFamily="serif"
            fontSize={16}
            x={label.x}
            y={label.y}
            fill="white"
            key={index}
            wrap={'none'}
          />
        ))}
      </Layer>
    );
  } else {
    return <></>;
  }
};

export { RulerTop };
