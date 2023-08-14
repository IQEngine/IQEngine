// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useEffect, useState } from 'react';
import { Layer, Rect, Text } from 'react-konva';
import { unitPrefixHz } from '@/utils/rf-functions';
import { useSpectrogramContext } from '../hooks/use-spectrogram-context';
import { useCursorContext } from '../hooks/use-cursor-context';

const FreqSelector = () => {
  const { spectrogramWidth, spectrogramHeight, meta, includeRfFreq } = useSpectrogramContext();
  const { cursorFreq, setCursorFreq, cursorFreqEnabled } = useCursorContext();
  const [lowerText, setLowerText] = useState('');
  const [upperText, setUpperText] = useState('');
  const [diffText, setDiffText] = useState('');
  const sampleRate = meta?.getSampleRate() || 0;
  const coreFrequency = (includeRfFreq) ? meta.getCenterFrequency() : 0;

  const lowerPosition = (cursorFreq.start + 0.5) * spectrogramWidth; // in pixels. this auto-updates
  const upperPosition = (cursorFreq.end + 0.5) * spectrogramWidth;

  useEffect(() => {
    const formatted = unitPrefixHz((lowerPosition / spectrogramWidth - 0.5) * sampleRate + coreFrequency);
    setLowerText(formatted.freq + ' ' + formatted.unit);
    const diffFormatted = unitPrefixHz(Math.abs(((upperPosition - lowerPosition) / spectrogramWidth) * sampleRate));
    setDiffText('Δ ' + diffFormatted.freq + ' ' + diffFormatted.unit);
  }, [lowerPosition, includeRfFreq]);

  useEffect(() => {
    const formatted = unitPrefixHz((upperPosition / spectrogramWidth - 0.5) * sampleRate + coreFrequency);
    setUpperText(formatted.freq + ' ' + formatted.unit);
    const diffFormatted = unitPrefixHz(Math.abs(((upperPosition - lowerPosition) / spectrogramWidth) * sampleRate));
    setDiffText('Δ ' + diffFormatted.freq + ' ' + diffFormatted.unit);
  }, [upperPosition, includeRfFreq]);

  const handleDragMoveLower = (e) => {
    let newX = e.target.x();
    if (newX <= 2) newX = 2;
    if (newX > spectrogramWidth - 2) newX = spectrogramWidth - 2;
    e.target.x(newX);
    e.target.y(0); // keep line in the same y location
    const newPos = newX / spectrogramWidth - 0.5;
    if (newPos < cursorFreq.end) {
      setCursorFreq({
        start: newPos,
        end: cursorFreq.end,
      });
    } else {
      setCursorFreq({
        start: cursorFreq.end,
        end: newPos,
      });
    }
  };

  const handleDragMoveUpper = (e) => {
    let newX = e.target.x();
    if (newX <= 2) newX = 2;
    if (newX > spectrogramWidth - 2) newX = spectrogramWidth - 2;
    e.target.x(newX);
    e.target.y(0); // keep line in the same y location
    const newPos = newX / spectrogramWidth - 0.5;
    if (newPos > cursorFreq.start) {
      setCursorFreq({
        start: cursorFreq.start,
        end: newPos,
      });
    } else {
      setCursorFreq({
        start: newPos,
        end: cursorFreq.start,
      });
    }
  };

  const handleMovement = (e) => {};

  const handleDragEnd = (e) => {
    setCursorFreq({
      start: Math.min(lowerPosition / spectrogramWidth - 0.5, upperPosition / spectrogramWidth - 0.5),
      end: Math.max(lowerPosition / spectrogramWidth - 0.5, upperPosition / spectrogramWidth - 0.5),
    });
  };

  // add cursor styling
  function onMouseOver() {
    document.body.style.cursor = 'move';
  }
  function onMouseOut() {
    document.body.style.cursor = 'default';
  }

  if (!cursorFreqEnabled) return null;

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
            listening={false}
          />

          <Rect
            x={lowerPosition}
            y={0}
            width={0}
            height={spectrogramHeight}
            draggable={true}
            onDragMove={handleDragMoveLower}
            onDragEnd={handleDragEnd}
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
            strokeEnabled={true}
            strokeWidth={5}
            stroke="blue"
            opacity={0.75}
            shadowColor="blue"
            shadowOffsetX={-3}
            shadowBlur={5}
          ></Rect>

          <Rect
            x={upperPosition}
            y={0}
            width={0}
            height={spectrogramHeight}
            draggable={true}
            onDragMove={handleDragMoveUpper}
            onDragEnd={handleDragEnd}
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
            strokeEnabled={true}
            strokeWidth={5}
            stroke="blue"
            opacity={0.75}
            shadowColor="blue"
            shadowOffsetX={3}
            shadowBlur={5}
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
