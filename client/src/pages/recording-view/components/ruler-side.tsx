// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect } from 'react';
import { Layer, Rect, Text } from 'react-konva';
import { useSpectrogramContext } from '../hooks/use-spectrogram-context';

interface RulerSideProps {
  currentRowAtTop: number;
}

const RulerSide = ({ currentRowAtTop }: RulerSideProps) => {
  const { meta, fftSize, spectrogramHeight, spectrogramWidth } = useSpectrogramContext();

  const [ticks, setTicks] = useState([]);
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    // Draw the vertical scales
    let num_ticks = spectrogramHeight / 10 + 1;
    let tms = (1000 * fftSize) / meta.getSampleRate(); // time_per_row_in_ms
    const temp_ticks = [];
    const temp_labels = [];
    for (let i = 0; i < num_ticks; i++) {
      if (i % 10 === 0) {
        temp_ticks.push({ x: 0, y: i * 10, width: 10, height: 0 });
        let yPos = tms * (currentRowAtTop + i * 10);
        yPos = Math.round(yPos * 100) / 100;
        // at this point its in ms
        if (yPos >= 1e3) {
          yPos = yPos / 1e3; // now its in seconds
          yPos = Math.round(yPos * 100) / 100;
        }
        temp_labels.push({
          text: yPos.toString(),
          x: 10,
          y: i * 10 - 7,
        }); // in ms
      } else {
        temp_ticks.push({ x: 0, y: i * 10, width: 5, height: 0 });
      }
    }
    setTicks(temp_ticks);
    setLabels(temp_labels);
  }, [fftSize, meta.getSampleRate(), spectrogramWidth, currentRowAtTop]); // updates when currentRowAtTop changes

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
            key={index + 2000000}
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
            key={index + 3000000}
            align="center"
          />
        ))}
      </Layer>
    );
  } else {
    return <></>;
  }
};

export { RulerSide };
