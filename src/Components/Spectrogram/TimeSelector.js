// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState, useEffect } from 'react';
import { Layer, Rect } from 'react-konva';

const TimeSelector = (props) => {
  const { spectrogramHeight, upperTile, lowerTile, handleTimeSelectionStart, handleTimeSelectionEnd } = props;

  const tileDiff = upperTile - lowerTile;

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
  }, []); // dont put dep here

  // Not start of the drag, its the sample-start bar
  const handleDragMoveStart = (e) => {
    setStartTileNum(handleMovement(e));
  };

  // Not end of the drag, its the sample-end bar
  const handleDragMoveEnd = (e) => {
    setEndTileNum(handleMovement(e));
  };

  const handleMovement = (e) => {
    let newY = e.target.y();
    if (newY <= 2) newY = 2;
    if (newY > spectrogramHeight - 2) newY = spectrogramHeight - 2;
    e.target.y(newY);
    e.target.x(0); // keep line in the same x location
    return (newY / 600) * tileDiff + lowerTile;
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
