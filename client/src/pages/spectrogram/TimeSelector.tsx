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
    handleTimeSelectionStart,
    handleTimeSelectionEnd,
    sampleRate,
  } = props;

  const [startTileNum, setStartTileNum] = useState(lowerTile + 0.25 * (upperTile - lowerTile) || 2);
  const [endTileNum, setEndTileNum] = useState(lowerTile + 0.75 * (upperTile - lowerTile) || 7);
  const [width, setWidth] = useState(spectrogramWidth);
  const [diffSamples, setDiffSamples] = useState('');
  const [diffSeconds, setDiffSeconds] = useState('');
  const [scalingFactor, setScalingFactor] = useState(spectrogramHeight / (upperTile - lowerTile));

  useEffect(() => {
    setWidth(props.spectrogramWidth);
  }, [props.spectrogramWidth]);

  useEffect(() => {
    setScalingFactor(spectrogramHeight / (upperTile - lowerTile));
  }, [upperTile, lowerTile, spectrogramHeight]);

  // Run once at beginning to set value in SpectrogramPage
  useEffectOnce(() => {
    handleTimeSelectionStart(startTileNum);
    handleTimeSelectionEnd(endTileNum);
  }); // dont put dep here

  // update diff
  useEffect(() => {
    const diffSamples = Math.round(Math.abs(endTileNum - startTileNum) * TILE_SIZE_IN_IQ_SAMPLES);
    const diffSeconds = diffSamples / sampleRate;
    const formatted = getSamples(diffSamples);
    setDiffSamples('Δ ' + formatted.samples + formatted.unit + ' samples');
    const formattedSeconds = getSeconds(diffSeconds);
    setDiffSeconds('Δ ' + formattedSeconds.time + ' ' + formattedSeconds.unit);
  }, [startTileNum, endTileNum]);

  // Sample-start bar
  const handleDragMoveStart = (e) => {
    setStartTileNum(handleMovement(e));
  };

  // Sample-end bar
  const handleDragMoveEnd = (e) => {
    setEndTileNum(handleMovement(e));
  };

  const handleMovement = (e) => {
    let newY = e.target.y();
    if (newY <= 2) newY = 2;
    if (newY > spectrogramHeight - 2) newY = spectrogramHeight - 2;
    e.target.y(newY);
    e.target.x(0); // keep line in the same x location
    return (newY / spectrogramHeight) * (upperTile - lowerTile) + lowerTile;
  };

  const updateTimeSelection = (e) => {
    handleTimeSelectionStart(Math.min(startTileNum, endTileNum));
    handleTimeSelectionEnd(Math.max(startTileNum, endTileNum));
  };

  return (
    <>
      <Layer>
        <>
          <Rect
            x={0}
            y={(startTileNum - lowerTile) * scalingFactor}
            width={width}
            height={(endTileNum - startTileNum) * scalingFactor}
            fill="black"
            opacity={0.4}
            listening={false}
          />

          <Rect
            x={0}
            y={(startTileNum - lowerTile) * scalingFactor}
            width={width}
            height={0}
            draggable={true}
            onDragMove={handleDragMoveStart}
            onDragEnd={updateTimeSelection}
            strokeEnabled={true}
            strokeWidth={5}
            stroke="white"
          ></Rect>

          <Rect
            x={0}
            y={(endTileNum - lowerTile) * scalingFactor}
            width={width}
            height={0}
            draggable={true}
            onDragMove={handleDragMoveEnd}
            onDragEnd={updateTimeSelection}
            strokeEnabled={true}
            strokeWidth={5}
            stroke="white"
          />

          <Text
            text={diffSamples}
            fontFamily="serif"
            fontSize={24}
            x={0}
            y={(startTileNum - lowerTile) * scalingFactor + 5}
            fill={'white'}
          />

          <Text
            text={diffSeconds}
            fontFamily="serif"
            fontSize={24}
            x={0}
            y={(startTileNum - lowerTile) * scalingFactor + 35}
            fill={'white'}
          />
        </>
      </Layer>
    </>
  );
};

export default TimeSelector;
