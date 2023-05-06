// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect } from 'react';
import { Layer, Rect, Text } from 'react-konva';

const RulerTop = (props) => {
  let { blob, fft, meta, windowFunction, spectrogramWidth, fftSize, sampleRate, spectrogramWidthScale } = props;

  const [ticks, setTicks] = useState([]);
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    const num_ticks = 16;
    const temp_ticks = [];
    const temp_labels = [];
    for (let i = 0; i <= num_ticks; i++) {
      if (i % (num_ticks / 4) === 0) {
        const text = (((i / num_ticks) * sampleRate - sampleRate / 2) / 1e6).toString();
        temp_labels.push({
          text: text,
          x: (spectrogramWidth / num_ticks) * i - 5,
          y: 5,
          width: text.length * 10, // rough approx
        }); // in ms
        temp_ticks.push({ x: (spectrogramWidth / num_ticks) * i, y: 20, width: 0, height: 5 });
      } else {
        temp_ticks.push({ x: (spectrogramWidth / num_ticks) * i, y: 15, width: 0, height: 10 });
      }
    }
    setTicks(temp_ticks);
    setLabels(temp_labels);
  }, [blob, fft, meta, spectrogramWidth, windowFunction, fftSize, sampleRate, spectrogramWidthScale]);

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
            fillEnabled="false"
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
            width={label.width}
            wrap={'none'}
            align="center" // only works if the width is set properly
          />
        ))}
      </Layer>
    );
  } else {
    return <></>;
  }
};

export { RulerTop };
