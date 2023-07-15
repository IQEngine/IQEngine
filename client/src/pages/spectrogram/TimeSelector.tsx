// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect } from 'react';
import { Layer, Rect, Text } from 'react-konva';
import { useEffectOnce } from 'usehooks-ts';
import { TILE_SIZE_IN_IQ_SAMPLES } from '@/utils/constants';
import { getSamples, getSeconds } from '@/utils/rfFunctions';

const TimeSelector = (props) => {
  const {
    spectrogramHeight,
    spectrogramWidth,
    upperTile,
    lowerTile,
    timeSelectionStart,
    timeSelectionEnd,
    setTimeSelectionStart,
    setTimeSelectionEnd,
    sampleRate,
  } = props;

  const [diffSamples, setDiffSamples] = useState('');
  const [diffSeconds, setDiffSeconds] = useState('');

  const scalingFactor = spectrogramHeight / (upperTile - lowerTile); // this will auto update as the 3 params update

  // Run once at beginning to set value in SpectrogramPage
  useEffectOnce(() => {
    setTimeSelectionStart(lowerTile + 0.25 * (upperTile - lowerTile) || 2);
    setTimeSelectionEnd(lowerTile + 0.75 * (upperTile - lowerTile) || 7);
  });

  // update diff
  useEffect(() => {
    const diffSamples = Math.round(Math.abs(timeSelectionEnd - timeSelectionStart) * TILE_SIZE_IN_IQ_SAMPLES);
    const diffSeconds = diffSamples / sampleRate;
    const formatted = getSamples(diffSamples);
    setDiffSamples('Δ ' + formatted.samples + formatted.unit + ' samples');
    const formattedSeconds = getSeconds(diffSeconds);
    setDiffSeconds('Δ ' + formattedSeconds.time + ' ' + formattedSeconds.unit);
  }, [timeSelectionStart, timeSelectionEnd]);

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
    return (newY / spectrogramHeight) * (upperTile - lowerTile) + lowerTile;
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
            y={(timeSelectionStart - lowerTile) * scalingFactor}
            width={spectrogramWidth}
            height={(timeSelectionEnd - timeSelectionStart) * scalingFactor}
            fill="black"
            opacity={0.4}
            listening={false}
          />

          <Rect
            x={0}
            y={(timeSelectionStart - lowerTile) * scalingFactor}
            width={spectrogramWidth}
            height={0}
            draggable={true}
            onDragMove={handleDragMoveStart}
            onDragEnd={updateTimeSelection}
            strokeEnabled={true}
            strokeWidth={5}
            stroke="red"
          ></Rect>

          <Rect
            x={0}
            y={(timeSelectionEnd - lowerTile) * scalingFactor}
            width={spectrogramWidth}
            height={0}
            draggable={true}
            onDragMove={handleDragMoveEnd}
            onDragEnd={updateTimeSelection}
            strokeEnabled={true}
            strokeWidth={5}
            stroke="red"
          />

          <Text
            text={diffSamples}
            fontFamily="serif"
            fontSize={24}
            x={0}
            y={(timeSelectionStart - lowerTile) * scalingFactor + 5}
            fill={'white'}
          />

          <Text
            text={diffSeconds}
            fontFamily="serif"
            fontSize={24}
            x={0}
            y={(timeSelectionStart - lowerTile) * scalingFactor + 35}
            fill={'white'}
          />
        </>
      </Layer>
    </>
  );
};

export default TimeSelector;
