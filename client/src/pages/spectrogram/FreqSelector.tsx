// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useEffect, useState } from 'react';
import { Layer, Rect, Text } from 'react-konva';
import { useEffectOnce } from 'usehooks-ts';
import { getFrequency } from '@/utils/rfFunctions';

const FreqSelector = (props) => {
  const { spectrogramWidth, spectrogramHeight, setFreqSelectionLower, setFreqSelectionUpper, sampleRate } = props;

  const [lowerPosition, setLowerPosition] = useState(spectrogramWidth * 0.4); // in pixels
  const [upperPosition, setUpperPosition] = useState(spectrogramWidth * 0.6); // in pixels
  const [lowerText, setLowerText] = useState('');
  const [upperText, setUpperText] = useState('');
  const [diffText, setDiffText] = useState('');

  // Run once at beginning to set value in SpectrogramPage
  useEffectOnce(() => {
    setFreqSelectionLower((lowerPosition / spectrogramWidth - 0.5) * sampleRate);
    setFreqSelectionUpper((upperPosition / spectrogramWidth - 0.5) * sampleRate);
  }); // dont put dep here

  useEffect(() => {
    const formatted = getFrequency((lowerPosition / spectrogramWidth - 0.5) * sampleRate);
    setLowerText(formatted.freq + ' ' + formatted.unit);
    const diffFormatted = getFrequency(Math.abs(((upperPosition - lowerPosition) / spectrogramWidth) * sampleRate));
    setDiffText('Δ ' + diffFormatted.freq + ' ' + diffFormatted.unit);
  }, [lowerPosition]);

  useEffect(() => {
    const formatted = getFrequency((upperPosition / spectrogramWidth - 0.5) * sampleRate);
    setUpperText(formatted.freq + ' ' + formatted.unit);
    const diffFormatted = getFrequency(Math.abs(((upperPosition - lowerPosition) / spectrogramWidth) * sampleRate));
    setDiffText('Δ ' + diffFormatted.freq + ' ' + diffFormatted.unit);
  }, [upperPosition]);

  const handleDragMoveLower = (e) => {
    setLowerPosition(handleMovement(e));
  };

  const handleDragMoveUpper = (e) => {
    setUpperPosition(handleMovement(e));
  };

  const handleMovement = (e) => {
    let newX = e.target.x();
    if (newX <= 2) newX = 2;
    if (newX > spectrogramWidth - 2) newX = spectrogramWidth - 2;
    e.target.x(newX);
    e.target.y(0); // keep line in the same y location
    return newX;
  };

  const handleDragEnd = (e) => {
    setFreqSelectionLower((lowerPosition / spectrogramWidth - 0.5) * sampleRate);
    setFreqSelectionUpper((upperPosition / spectrogramWidth - 0.5) * sampleRate);
  };

  return (
    <>
      <Layer>
        <>
          <Rect
            x={lowerPosition}
            y={0}
            width={upperPosition - lowerPosition}
            height={spectrogramHeight}
            fill="black"
            opacity={0.4}
          />

          <Rect
            x={lowerPosition}
            y={0}
            width={0}
            height={spectrogramHeight}
            draggable={true}
            onDragMove={handleDragMoveLower}
            onDragEnd={handleDragEnd}
            strokeEnabled={true}
            strokeWidth={5}
            stroke="white"
          ></Rect>

          <Rect
            x={upperPosition}
            y={0}
            width={0}
            height={spectrogramHeight}
            draggable={true}
            onDragMove={handleDragMoveUpper}
            onDragEnd={handleDragEnd}
            strokeEnabled={true}
            strokeWidth={5}
            stroke="white"
          />

          <Text text={lowerText} fontFamily="serif" fontSize={24} x={lowerPosition + 5} y={0} fill={'white'} />
          <Text text={upperText} fontFamily="serif" fontSize={24} x={upperPosition + 5} y={0} fill={'white'} />
          <Text
            text={diffText}
            fontFamily="serif"
            fontSize={24}
            x={upperPosition / 2 + lowerPosition / 2 - 70}
            y={25}
            fill={'white'}
          />
        </>
      </Layer>
    </>
  );
};

export default FreqSelector;
