// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
import { Layer, Rect } from 'react-konva';
import { TILE_SIZE_IN_IQ_SAMPLES } from '@/utils/constants';

const TimeSelectorMinimap = (props) => {
  const {
    spectrogramHeight,
    width,
    upperTile,
    lowerTile,
    timeSelectionStart,
    timeSelectionEnd,
    setTimeSelectionStart,
    setTimeSelectionEnd,
    totalSamples,
  } = props;

  // Sample-start bar
  const handleDragMoveStart = (e) => {
    setTimeSelectionStart(handleMovement(e));
  };

  // Sample-end bar
  const handleDragMoveEnd = (e) => {
    setTimeSelectionEnd(handleMovement(e));
  };

  const handleMovement = (e) => {
    let newY = e.target.y();
    if (newY <= 2) newY = 2;
    if (newY > spectrogramHeight - 2) newY = spectrogramHeight - 2;
    e.target.y(newY);
    e.target.x(0); // keep line in the same x location
    return (newY / spectrogramHeight) * (totalSamples / TILE_SIZE_IN_IQ_SAMPLES);
  };

  // at drag end is when we'll swap the two if they changed sides, so that Start < End
  const updateTimeSelection = (e) => {
    setTimeSelectionStart(Math.min(timeSelectionStart, timeSelectionEnd));
    setTimeSelectionEnd(Math.max(timeSelectionStart, timeSelectionEnd));
  };

  return (
    <>
      <Layer>
        <>
          <Rect
            x={0}
            y={(timeSelectionStart / (totalSamples / TILE_SIZE_IN_IQ_SAMPLES)) * spectrogramHeight}
            width={width}
            height={0}
            draggable={true}
            onDragMove={handleDragMoveStart}
            onDragEnd={updateTimeSelection}
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
            y={(timeSelectionEnd / (totalSamples / TILE_SIZE_IN_IQ_SAMPLES)) * spectrogramHeight}
            width={width}
            height={0}
            draggable={true}
            onDragMove={handleDragMoveEnd}
            onDragEnd={updateTimeSelection}
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
