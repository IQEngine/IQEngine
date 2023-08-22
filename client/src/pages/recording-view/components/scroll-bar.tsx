// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect, useMemo } from 'react';
import { Layer, Rect, Image } from 'react-konva';
import { MINIMUM_SCROLL_HANDLE_HEIGHT_PIXELS, MINIMAP_FFT_SIZE } from '@/utils/constants';
import { useGetIQData, useGetMinimapIQ, useRawIQData } from '@/api/iqdata/Queries';
import { useSpectrogramContext } from '../hooks/use-spectrogram-context';
import { colMaps } from '@/utils/colormap';
import { calcFfts, fftToRGB } from '@/utils/selector';

interface ScrollBarProps {
  currentFFT: number;
  setCurrentFFT: (currentFFT: number) => void;
}

const ScrollBar = ({ currentFFT, setCurrentFFT }: ScrollBarProps) => {
  const {
    type,
    account,
    container,
    filePath,
    meta,
    spectrogramHeight,
    fftSize,
    fftStepSize,
    colmap,
    magnitudeMin,
    setMagnitudeMin,
    magnitudeMax,
    setMagnitudeMax,
    windowFunction,
  } = useSpectrogramContext();

  const { data: minimapData } = useGetMinimapIQ(type, account, container, filePath);
  const { downloadedIndexes } = useRawIQData(type, account, container, filePath, fftSize);

  const [minimapImg, setMinimapImg] = useState(null);
  const [ticks, setTicks] = useState([]);
  const [handleHeightPixels, setHandleHeightPixels] = useState(1);
  const [scalingFactor, setScalingFactor] = useState(1);

  const ffts = useMemo(() => {
    if (!minimapData) return null;
    // transform the minimap data into an one bif FLOAT32ARRAY
    const iqData = new Float32Array(minimapData.length * minimapData[0].length);
    for (let i = 0; i < minimapData.length; i++) {
      iqData.set(minimapData[i], i * minimapData[i].length);
    }
    //performance.mark('calcFftOfTile');
    const ffts_calc = calcFfts(iqData, MINIMAP_FFT_SIZE, windowFunction, 1000);
    //console.debug(performance.measure('calcFftOfTile', 'calcFftOfTile'));

    const min = Math.min(...ffts_calc);
    const max = Math.max(...ffts_calc);
    setMagnitudeMin(min);
    setMagnitudeMax(max);
    return ffts_calc;
  }, [minimapData]);

  // Calc scroll handle height and new scaling factor
  useEffect(() => {
    if (!meta) return;
    let newHandleHeight =
      (spectrogramHeight / (meta.getTotalSamples() / fftSize / (fftStepSize + 1))) * spectrogramHeight;
    setHandleHeightPixels(Math.max(MINIMUM_SCROLL_HANDLE_HEIGHT_PIXELS, newHandleHeight));

    const totalffts = meta.getTotalSamples() / fftSize;
    // get the length ot any of the iqData arrays
    const newScalingFactor = totalffts / spectrogramHeight;
    setScalingFactor(newScalingFactor);
  }, [spectrogramHeight, fftSize, fftStepSize, meta]);

  const downloadedIndexesMemo = useMemo(() => {
    if (!downloadedIndexes || !meta) return [];
    // we will have a maximum of 100 tiles to show data that has been downloaded
    const tiles = [];
    const downloadScaling = meta.getTotalSamples() / fftSize / 100;
    for (let i = 0; i < 100; i++) {
      const exist = downloadedIndexes.find((x) => x >= i * downloadScaling && x < (i + 1) * downloadScaling);
      if (exist) {
        tiles.push(i);
      }
    }
    return tiles;
  }, [meta, fftSize, downloadedIndexes]);

  // Calc the minimap image from ffts to rgb
  useEffect(() => {
    if (!ffts) return;
    const rgbData = fftToRGB(ffts, MINIMAP_FFT_SIZE, magnitudeMin, magnitudeMax, colMaps[colmap]);
    let num_final_ffts = ffts.length / MINIMAP_FFT_SIZE;
    const newImageData = new ImageData(rgbData, MINIMAP_FFT_SIZE, num_final_ffts);

    createImageBitmap(newImageData).then((imageBitmap) => {
      setMinimapImg(imageBitmap);
    });
  }, [ffts, magnitudeMin, magnitudeMax, colmap]);

  // Calc the annotation ticks
  useEffect(() => {
    if (!meta) {
      return;
    }
    // Add a tick wherever there are annotations
    let t = [];
    meta.annotations.forEach((annotation) => {
      t.push({
        y: annotation['core:sample_start'] / fftSize,
        height: annotation['core:sample_count'] / fftSize,
        x:
          ((annotation['core:freq_lower_edge'] -
            meta.captures[0]['core:frequency'] +
            meta.global['core:sample_rate'] / 2) /
            meta.global['core:sample_rate']) *
          MINIMAP_FFT_SIZE,
        width:
          ((annotation['core:freq_upper_edge'] - annotation['core:freq_lower_edge']) /
            meta.global['core:sample_rate']) *
          MINIMAP_FFT_SIZE,
      });
    });
    setTicks(t);
  }, [meta, scalingFactor]); // dont add anymore here, so that this triggers ONLY at the start

  const handleClick = (e) => {
    let currentY = e.evt.offsetY;
    let newY = currentY - handleHeightPixels / 2; // assume we want the handle centered where we click but we have to send fetchAndRender the top of the handle
    if (newY < 0) {
      newY = 0;
    }
    if (newY > spectrogramHeight - handleHeightPixels) {
      newY = spectrogramHeight - handleHeightPixels;
    }
    setCurrentFFT(Math.floor(newY * scalingFactor));
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scrollAmount = Math.floor(e.evt.wheelDeltaY);

    const nextPosition = currentFFT - scrollAmount + spectrogramHeight * (fftStepSize + 1);
    const maxPosition = meta.getTotalSamples() / fftSize;

    if (nextPosition <= maxPosition) {
      setCurrentFFT(Math.max(0, currentFFT - scrollAmount));
    }
  };

  const handleDragMove = (e) => {
    let newY = e.target.y();
    if (newY <= 0) {
      e.target.y(0);
      newY = 0;
    }
    if (newY > spectrogramHeight - handleHeightPixels) {
      e.target.y(spectrogramHeight - handleHeightPixels);
      newY = spectrogramHeight - handleHeightPixels;
    }
    e.target.x(0);
    setCurrentFFT(Math.floor(newY * scalingFactor));
  };

  return (
    <>
      <Layer onWheel={handleWheel}>
        {minimapImg ? (
          <Image
            onClick={handleClick}
            image={minimapImg}
            x={0}
            y={0}
            width={MINIMAP_FFT_SIZE}
            height={spectrogramHeight}
          />
        ) : (
          <Rect
            x={0}
            y={0}
            fill="grey"
            width={MINIMAP_FFT_SIZE}
            height={spectrogramHeight}
            strokeWidth={4}
            onClick={handleClick}
          ></Rect>
        )}
      </Layer>
      <Layer onWheel={handleWheel}>
        <Rect
          x={0}
          y={currentFFT / scalingFactor}
          fill="black"
          opacity={minimapImg ? 0.6 : 1}
          width={MINIMAP_FFT_SIZE}
          height={handleHeightPixels}
          draggable={true}
          onDragMove={handleDragMove}
        ></Rect>

        {/* box for each annotation */}
        {ticks.map((tick, index) => (
          <Rect
            x={tick.x}
            y={tick.y / scalingFactor}
            width={tick.width}
            height={tick.height / scalingFactor}
            fillEnabled={false}
            //fill="white"
            stroke="white"
            strokeWidth={1}
            key={'annotation' + index.toString()}
          />
        ))}

        {/* white boxes showing what has been downloaded */}
        {downloadedIndexesMemo?.map((fftIndx) => (
          <Rect
            x={MINIMAP_FFT_SIZE}
            y={(fftIndx * spectrogramHeight) / 100}
            width={5}
            height={spectrogramHeight / 100}
            fillEnabled={true}
            fill="grey"
            strokeWidth={0}
            key={Math.random() * 1000000 + Math.random()}
          />
        ))}
      </Layer>
    </>
  );
};

export default ScrollBar;
