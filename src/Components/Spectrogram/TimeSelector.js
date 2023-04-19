// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect } from 'react';
import { Layer, Rect } from 'react-konva';

const TimeSelector = (props) => {
  const { spectrogramHeight, upperTile, lowerTile, handleTimeSelectionStart, handleTimeSelectionEnd } = props;
  const tileDiff = upperTile - lowerTile; // amount of samples displayed on the spectrogram in units of tiles

  const [startTileNum, setStartTileNum] = useState(lowerTile + 0.25 * tileDiff || 2);
  const [endTileNum, setEndTileNum] = useState(lowerTile + 0.75 * tileDiff || 7);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    setWidth(props.spectrogramWidth);
  }, [props.spectrogramWidth]);

  // Run once at beginning to set value in SpectrogramPage
  useEffect(() => {
    handleTimeSelectionStart(startTileNum);
    handleTimeSelectionEnd(endTileNum);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // dont put dep here

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
    return (newY / 600) * tileDiff + lowerTile; // FIXME: at some point the spectrogram wont always be 600 pixels tall!
  };

  return (
    <>
      <Layer>
        <>
          <Rect
            x={0}
            y={((startTileNum - lowerTile) / tileDiff) * 600}
            width={width}
            height={((endTileNum - startTileNum) / tileDiff) * 600}
            fill="black"
            opacity={0.4}
          />
          <Rect
            x={0}
            y={((startTileNum - lowerTile) / tileDiff) * 600}
            width={width}
            height={0}
            draggable={true}
            onDragMove={handleDragMoveStart}
            onDragEnd={() => handleTimeSelectionStart(startTileNum)}
            strokeEnabled={true}
            strokeWidth={5}
            stroke="white"
          ></Rect>
          <Rect
            x={0}
            y={((endTileNum - lowerTile) / tileDiff) * 600}
            width={width}
            height={0}
            draggable={true}
            onDragMove={handleDragMoveEnd}
            onDragEnd={() => handleTimeSelectionEnd(endTileNum)}
            strokeEnabled={true}
            strokeWidth={5}
            stroke="white"
          />
        </>
      </Layer>
    </>
  );
};

export default TimeSelector;
