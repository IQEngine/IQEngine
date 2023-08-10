// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect, useMemo } from 'react';
import { Layer, Rect, Image } from 'react-konva';
import { MINIMUM_SCROLL_HANDLE_HEIGHT_PIXELS, MINIMAP_FFT_SIZE } from '@/utils/constants';
import { useGetIQData, useRawIQData } from '@/api/iqdata/Queries';
import { useSpectrogramContext } from '../hooks/use-spectrogram-context';
import { colMaps } from '@/utils/colormap';
import { calcFftOfTile, fftToRGB } from '@/utils/selector';

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
  const { currentData, setFFTsRequired, fftsRequired } = useGetIQData(
    type,
    account,
    container,
    filePath,
    MINIMAP_FFT_SIZE
  );

  const { downloadedIndexes } = useRawIQData(type, account, container, filePath, fftSize);

  const [minimapImg, setMinimapImg] = useState(null);
  const [ticks, setTicks] = useState([]);
  const [handleHeightPixels, setHandleHeightPixels] = useState(1);
  const [scalingFactor, setScalingFactor] = useState(1);

  const downloadedTiles = useMemo(() => {
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

  // Changes in the spectrogram height require a recalculation of the ffts required
  useEffect(() => {
    // for minimap only. there's so much overhead with blob downloading that this might as well be a high value...
    const skipNFfts = Math.floor(meta.getTotalSamples() / (spectrogramHeight * MINIMAP_FFT_SIZE)); // sets the decimation rate (manually tweaked)
    const numFfts = Math.floor(meta.getTotalSamples() / MINIMAP_FFT_SIZE / (skipNFfts + 1));
    let dataRange = [];
    for (let i = 0; i < numFfts; i++) {
      dataRange.push(i * skipNFfts);
    }
    setFFTsRequired(dataRange);
  }, [meta?.getTotalSamples(), spectrogramHeight]);

  // filter the displayed iq as we receive new data
  const displayedIQ = useMemo<Float32Array>(() => {
    // join the current ffts
    if (!currentData || !fftsRequired) return new Float32Array(0);
    const iqData = new Float32Array(MINIMAP_FFT_SIZE * fftsRequired.length * 2);
    let offset = 0;
    for (let i = 0; i < fftsRequired.length; i++) {
      const iqDataSlice = currentData[fftsRequired[i]];
      iqData.set(iqDataSlice, offset);
      offset += iqDataSlice.length;
    }
    return iqData;
  }, [currentData]);

  const ffts = useMemo(() => {
    if (!displayedIQ) return null;
    performance.mark('calcFftOfTile');
    const ffts_calc = calcFftOfTile(displayedIQ, MINIMAP_FFT_SIZE, windowFunction, spectrogramHeight);
    console.debug(performance.measure('calcFftOfTile', 'calcFftOfTile'));
    const min = Math.min(...ffts_calc);
    const max = Math.max(...ffts_calc);
    setMagnitudeMin(min);
    setMagnitudeMax(max);
    return ffts_calc;
  }, [displayedIQ]);

  // Calc scroll handle height and new scaling factor
  useEffect(() => {
    if (!meta) return;
    let newHandleHeight =
      (spectrogramHeight / (meta.getTotalSamples() / fftSize / (fftStepSize + 1))) * spectrogramHeight;
    setHandleHeightPixels(Math.max(MINIMUM_SCROLL_HANDLE_HEIGHT_PIXELS, newHandleHeight));

    if (fftsRequired.length > 0) {
      const totalffts = meta.getTotalSamples() / fftSize;
      // get the length ot any of the iqData arrays
      const newScalingFactor = totalffts / spectrogramHeight;
      setScalingFactor(newScalingFactor);
    }
  }, [spectrogramHeight, fftSize, fftStepSize, meta, fftsRequired]);

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
        {downloadedTiles?.map((tile) => (
          <Rect
            x={MINIMAP_FFT_SIZE}
            y={((tile - 1) * spectrogramHeight) / 100}
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
