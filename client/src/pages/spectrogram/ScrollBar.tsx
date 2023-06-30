// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect, useMemo } from 'react';
import { Layer, Rect, Image } from 'react-konva';
import { fftshift } from 'fftshift';
import { MINIMUM_SCROLL_HANDLE_HEIGHT_PIXELS, TILE_SIZE_IN_IQ_SAMPLES, MINIMAP_FFT_SIZE } from '@/utils/constants';
import { FFT } from '@/utils/fft';
import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { getIQDataFullIndexes } from '@/api/iqdata/Queries';
import { IQDataSlice } from '@/api/Models';

interface ScrollBarProps {
  meta: SigMFMetadata;
  spectrogramHeight: number;
  fetchAndRender: any;
  downloadedTiles: any;
  zoomLevel: number;
  handleTop: number;
  fetchEnabled: boolean;
  fftSize: number; // fftsize used for main spectrogram, not when calc scrollbar ffts!
  setMagnitudeMax: any;
  setMagnitudeMin: any;
  colorMap: any;
}

const ScrollBar = (props: ScrollBarProps) => {
  let {
    meta,
    spectrogramHeight,
    fetchAndRender,
    downloadedTiles,
    zoomLevel,
    handleTop,
    fetchEnabled,
    fftSize,
    colorMap,
  } = props;

  const [dataRange, setDataRange] = useState([]);
  const [skipNFfts, setSkipNFfts] = useState(0);

  const iqSlices = getIQDataFullIndexes(meta, dataRange, MINIMAP_FFT_SIZE, fetchEnabled);

  const [minimapImg, setMinimapImg] = useState(null);
  const [ticks, setTicks] = useState([]);
  const [handleHeightPixels, setHandleHeightPixels] = useState(1);
  const [scalingFactor, setScalingFactor] = useState(1);

  useEffect(() => {
    console.debug('minimap meta changed', meta);
    if (meta) {
      // for minimap only. there's so much overhead with blob downloading that this might as well be a high value...
      const skipNFfts = Math.floor(meta.getTotalSamples() / 10e3); // sets the decimation rate (manually tweaked)
      setSkipNFfts(skipNFfts);
      const numFfts = Math.floor(meta.getTotalSamples() / MINIMAP_FFT_SIZE / (skipNFfts + 1));
      let dataRange = [];
      for (let i = 0; i < numFfts; i++) {
        dataRange.push(i * skipNFfts);
      }
      setDataRange(dataRange);
    }
  }, [meta]);

  // Calc scroll handle height and new scaling factor
  useEffect(() => {
    if (!meta) return;
    let newHandleHeight = (spectrogramHeight / (meta.getTotalSamples() / fftSize / zoomLevel)) * spectrogramHeight;
    if (newHandleHeight < MINIMUM_SCROLL_HANDLE_HEIGHT_PIXELS) newHandleHeight = MINIMUM_SCROLL_HANDLE_HEIGHT_PIXELS;
    setHandleHeightPixels(newHandleHeight);

    if (iqSlices.data) {
      // get the length ot any of the iqData arrays
      const newScalingFactor = spectrogramHeight / MINIMAP_FFT_SIZE / (skipNFfts + 1) / dataRange.length;
      setScalingFactor(newScalingFactor);
    }
  }, [spectrogramHeight, fftSize, zoomLevel, iqSlices.data, meta]);

  // This only runs once, once all the minimap fetches have occurred, or when colormap changes
  useEffect(() => {
    if (!iqSlices.data || !meta) {
      return;
    }
    console.log('Rendering Scrollbar');
    console.debug('minimap fetches complete', iqSlices.data);
    let iqData = {};
    iqSlices.data.forEach((slice: IQDataSlice) => {
      iqData[slice.index] = slice.iqArray;
    });

    // Loop through the samples we downloaded, calc FFT and produce spectrogram image
    const newScalingFactor = spectrogramHeight / MINIMAP_FFT_SIZE / (skipNFfts + 1) / dataRange.length;
    setScalingFactor(newScalingFactor);
    // Find max/min magnitudes across entire minimap
    let minimumVal = Infinity;
    let maximumVal = -Infinity;
    let magnitudesBuffer = new Float64Array(MINIMAP_FFT_SIZE * dataRange.length); // only typed arrays have set()
    dataRange.forEach((sampleIndex, i) => {
      const samples = iqData[sampleIndex];
      // Calc PSD
      const f = new FFT(MINIMAP_FFT_SIZE);
      let out = f.createComplexArray(); // creates an empty array the length of fft.size*2
      f.transform(out, samples); // assumes input (2nd arg) is in form IQIQIQIQ and twice the length of fft.size
      out = out.map((x) => x / MINIMAP_FFT_SIZE); // divide by fftsize
      let magnitudes = new Array(out.length / 2);
      for (let j = 0; j < out.length / 2; j++) {
        magnitudes[j] = Math.sqrt(Math.pow(out[j * 2], 2) + Math.pow(out[j * 2 + 1], 2)); // take magnitude
      }
      fftshift(magnitudes); // in-place
      magnitudes = magnitudes.map((x) => 10.0 * Math.log10(x)); // convert to dB
      magnitudes = magnitudes.map((x) => (isFinite(x) ? x : 0)); // get rid of -infinity which happens when the input is all 0s
      if (Math.min(...magnitudes) < minimumVal) minimumVal = Math.min(...magnitudes);
      if (Math.max(...magnitudes) > maximumVal) maximumVal = Math.max(...magnitudes);
      magnitudesBuffer.set(magnitudes, i * MINIMAP_FFT_SIZE);
    });

    let minimapArray = new Uint8ClampedArray(MINIMAP_FFT_SIZE * dataRange.length * 4);
    let startOfs = 0;
    console.debug('min/max', minimumVal, maximumVal);
    for (let i = 0; i < dataRange.length; i++) {
      let magnitudes = magnitudesBuffer.slice(i * MINIMAP_FFT_SIZE, (i + 1) * MINIMAP_FFT_SIZE);

      // apply magnitude min and max (which are in dB, same units as magnitudes prior to this point) and convert to 0-255
      const magnitude_max = maximumVal - 0; // dB
      props.setMagnitudeMax(magnitude_max);
      const magnitude_min = minimumVal + 20; // dB
      props.setMagnitudeMin(magnitude_min - 10); // because the minimap fft is so small, the value isnt good as-is, so subtract 10
      const dbPer1 = 255 / (magnitude_max - magnitude_min);
      magnitudes = magnitudes.map((x) => x - magnitude_min);
      magnitudes = magnitudes.map((x) => x * dbPer1);
      magnitudes = magnitudes.map((x) => (x > 255 ? 255 : x)); // clip above 255
      magnitudes = magnitudes.map((x) => (x < 0 ? 0 : x)); // clip below 0
      let ipBuf8 = Uint8ClampedArray.from(magnitudes); // anything over 255 or below 0 at this point will become a random number, hence clipping above

      let lineOffset = i * MINIMAP_FFT_SIZE * 4;
      for (let sigVal, opIdx = 0, ipIdx = startOfs; ipIdx < MINIMAP_FFT_SIZE + startOfs; opIdx += 4, ipIdx++) {
        sigVal = ipBuf8[ipIdx] || 0; // if input line too short add zeros
        minimapArray[lineOffset + opIdx] = colorMap[sigVal][0]; // red
        minimapArray[lineOffset + opIdx + 1] = colorMap[sigVal][1]; // green
        minimapArray[lineOffset + opIdx + 2] = colorMap[sigVal][2]; // blue
        minimapArray[lineOffset + opIdx + 3] = 255; // alpha
      }
    }

    // Render Image
    const imageData = new ImageData(minimapArray, MINIMAP_FFT_SIZE, dataRange.length);
    createImageBitmap(imageData).then((ret) => {
      setMinimapImg(ret);
    });
  }, [iqSlices.data, colorMap]); // dont add anymore here, so that this triggers ONLY at the start

  // Calc the annotation ticks
  useEffect(() => {
    if (!meta) {
      return;
    }
    console.log('Rendering scrollbar ticks');
    // Add a tick wherever there are annotations
    let t = [];
    meta.annotations.forEach((annotation) => {
      t.push({
        y: annotation['core:sample_start'] * scalingFactor,
        height: annotation['core:sample_count'] * scalingFactor,
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
    fetchAndRender(newY);
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    let scrollDirection = -e.evt.wheelDeltaY / Math.abs(e.evt.wheelDeltaY);
    let scrollAmount = scrollDirection * 12;
    let newY = Math.min(spectrogramHeight - handleHeightPixels, Math.max(0, handleTop + scrollAmount));
    fetchAndRender(newY);
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
    fetchAndRender(newY);
  };

  if (!minimapImg) {
    return (
      <>
        <Layer onWheel={handleWheel}>
          <Rect
            x={0}
            y={0}
            fill="grey"
            width={MINIMAP_FFT_SIZE}
            height={spectrogramHeight}
            strokeWidth={4}
            onClick={handleClick}
          ></Rect>
          <Rect
            x={0}
            y={handleTop}
            fill="black"
            width={MINIMAP_FFT_SIZE}
            height={handleHeightPixels}
            draggable={true}
            onDragMove={handleDragMove}
          ></Rect>
        </Layer>
      </>
    );
  }

  return (
    <>
      <Layer onWheel={handleWheel}>
        <Image image={minimapImg} x={0} y={0} width={MINIMAP_FFT_SIZE} height={spectrogramHeight} />
        {/* This rect is invisible */}
        <Rect
          x={0}
          y={0}
          fill="grey"
          opacity={0}
          width={MINIMAP_FFT_SIZE}
          height={spectrogramHeight}
          strokeWidth={4}
          onClick={handleClick}
        ></Rect>
      </Layer>
      <Layer onWheel={handleWheel}>
        <Rect
          x={0}
          y={handleTop}
          fill="black"
          opacity={0.6}
          width={MINIMAP_FFT_SIZE}
          height={handleHeightPixels}
          draggable={true}
          onDragMove={handleDragMove}
        ></Rect>

        {/* box for each annotation */}
        {ticks.map((tick, index) => (
          <Rect
            x={tick.x}
            y={tick.y}
            width={tick.width}
            height={tick.height}
            fillEnabled={false}
            //fill="white"
            stroke="white"
            strokeWidth={1}
            key={'annotation' + index.toString()}
          />
        ))}

        {/* white boxes showing what has been downloaded */}
        {downloadedTiles.map((tile, index) => (
          <Rect
            x={MINIMAP_FFT_SIZE}
            y={parseInt(tile) * TILE_SIZE_IN_IQ_SAMPLES * scalingFactor}
            width={5}
            height={TILE_SIZE_IN_IQ_SAMPLES * scalingFactor}
            fillEnabled={true}
            fill="grey"
            //stroke="black"
            strokeWidth={0}
            key={Math.random() * 1000000 + Math.random()}
          />
        ))}
      </Layer>
    </>
  );
};

export default ScrollBar;
