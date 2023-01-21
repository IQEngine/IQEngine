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
    if (newY <= 0) newY = 0;
    if (newY > spectrogramHeight - 2) e.target.y(spectrogramHeight - 2);
    e.target.y(newY);
    e.target.x(0); // keep line in the same x location
    return (newY / 600) * tileDiff + lowerTile;
  };

  return (
    <>
      <Layer>
        {props.lowerTile <= startTileNum && (
          <>
            {/* 
            <Text
              text="Start"
              fontFamily="serif"
              fontSize={20}
              x={width - 50}
              y={((startTileNum - lowerTile) / tileDiff) * 600 - 20}
              fill="black"
              fontStyle="bold" // tells the event which annotation to update
            />
            */}
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
          </>
        )}
        {props.lowerTile <= endTileNum && (
          <>
            {/*
            <Text
              text="End"
              fontFamily="serif"
              fontSize={20}
              x={width - 50}
              y={((endTileNum - lowerTile) / tileDiff) * 600 - 20}
              fill="black"
              fontStyle="bold" // tells the event which annotation to update
            />
        */}
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
        )}
      </Layer>
    </>
  );
};

export default TimeSelector;
