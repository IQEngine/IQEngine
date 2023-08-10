// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
import { Layer, Rect } from 'react-konva';
import { MINIMAP_FFT_SIZE } from '@/utils/constants';
import { useSpectrogramContext } from '../hooks/use-spectrogram-context';
import { useCursorContext } from '../hooks/use-cursor-context';

const TimeSelectorMinimap = ({ currentFFT }) => {
  const { spectrogramHeight, meta, fftSize } = useSpectrogramContext();
  const { cursorTime, cursorTimeEnabled, setCursorTime } = useCursorContext();
  const cursorStartFFT = Math.floor(cursorTime.start / fftSize);
  const cursorEndFFT = Math.floor(cursorTime.end / fftSize);
  const cursorYStart = cursorStartFFT - currentFFT;
  const cursorYEnd = cursorEndFFT - currentFFT;
  const totalFFTs = meta.getTotalSamples() / fftSize;
  const scalingFactor = totalFFTs / spectrogramHeight;
  // Sample-start bar
  const handleDragMoveStart = (e) => {
    e.target.x(0); // keep line in the same x location
    const newStartSample = Math.max(0, e.target.y() * fftSize * scalingFactor);
    // check if there is the need to reverse the two
    if (newStartSample > cursorTime.end) {
      setCursorTime({
        start: cursorTime.end,
        end: newStartSample,
      });
    } else {
      setCursorTime({
        start: newStartSample,
        end: cursorTime.end,
      });
    }
  };

  // Sample-end bar
  const handleDragMoveEnd = (e) => {
    e.target.x(0); // keep line in the same x location
    const newStartSample = Math.max(totalFFTs, e.target.y() * fftSize * scalingFactor);
    if (newStartSample > cursorTime.start) {
      setCursorTime({
        start: cursorTime.start,
        end: newStartSample,
      });
    } else {
      setCursorTime({
        start: newStartSample,
        end: cursorTime.start,
      });
    }
  };

  // add cursor styling
  function onMouseOver() {
    document.body.style.cursor = 'move';
  }
  function onMouseOut() {
    document.body.style.cursor = 'default';
  }

  if (!cursorTimeEnabled) return null;

  return (
    <>
      <Layer>
        <>
          <Rect
            x={0}
            y={cursorYStart / scalingFactor}
            width={MINIMAP_FFT_SIZE}
            height={0}
            draggable={true}
            onDragMove={handleDragMoveStart}
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
            strokeEnabled={true}
            strokeWidth={5}
            stroke="red"
            opacity={0.75}
            shadowColor="red"
            shadowOffsetY={-3}
            shadowBlur={5}
          ></Rect>

          <Rect
            x={0}
            y={cursorYEnd / scalingFactor}
            width={MINIMAP_FFT_SIZE}
            height={0}
            draggable={true}
            onDragMove={handleDragMoveEnd}
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
            strokeEnabled={true}
            strokeWidth={5}
            stroke="red"
            opacity={0.75}
            shadowColor="red"
            shadowOffsetY={3}
            shadowBlur={5}
          />
        </>
      </Layer>
    </>
  );
};

export default TimeSelectorMinimap;
