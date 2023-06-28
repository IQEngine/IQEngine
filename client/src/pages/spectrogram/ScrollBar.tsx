// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect, useMemo } from 'react';
import { Layer, Rect, Image } from 'react-konva';
import { fftshift } from 'fftshift';
import { MINIMUM_SCROLL_HANDLE_HEIGHT_PIXELS, TILE_SIZE_IN_IQ_SAMPLES } from '@/Utils/constants';
import { FFT } from '@/Utils/fft';
import { SigMFMetadata } from '@/Utils/sigmfMetadata';
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
  fftSizeScrollbar: number;
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
    fftSizeScrollbar,
    colorMap,
  } = props;

  const [dataRange, setDataRange] = useState([]);
  const [skipNFfts, setSkipNFfts] = useState(0);

  const iqSlices = getIQDataFullIndexes(meta, dataRange, fftSizeScrollbar, fetchEnabled);

  const [minimapImg, setMinimapImg] = useState(null);
  const scrollbarWidth = 50;
  const [ticks, setTicks] = useState([]);
  const [handleHeightPixels, setHandleHeightPixels] = useState(1);
  const [scalingFactor, setScalingFactor] = useState(1);

  useEffect(() => {
    console.debug('minimap meta changed', meta);
    if (meta) {
      // for minimap only. there's so much overhead with blob downloading that this might as well be a high value...
      const skipNFfts = Math.floor(meta.getTotalSamples() / 100e3); // sets the decimation rate (manually tweaked)
      setSkipNFfts(skipNFfts);
      const numFfts = Math.floor(meta.getTotalSamples() / fftSizeScrollbar / (skipNFfts + 1));
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
    let x = (spectrogramHeight / (meta.getTotalSamples() / fftSizeScrollbar / zoomLevel)) * spectrogramHeight;
    if (x < MINIMUM_SCROLL_HANDLE_HEIGHT_PIXELS) x = MINIMUM_SCROLL_HANDLE_HEIGHT_PIXELS;
    setHandleHeightPixels(x);

    if (iqSlices.data) {
      // get the length ot any of the iqData arrays
      const fftSizeScrollbar = iqSlices.data[0].iqArray.length / 2; // just use the first one to find length
      const newScalingFactor = spectrogramHeight / fftSizeScrollbar / (skipNFfts + 1) / dataRange.length;
      setScalingFactor(newScalingFactor);

      // Recalc annotation tick placement
      let t = [];
      meta?.annotations.forEach((annotation) => {
        t.push({
          y: annotation['core:sample_start'] * newScalingFactor,
          height: annotation['core:sample_count'] * newScalingFactor,
        });
      });
      setTicks(t);
    }
  }, [spectrogramHeight, fftSizeScrollbar, zoomLevel, iqSlices.data, meta]);

  // This only runs once, once all the minimap fetches have occurred
  useEffect(() => {
    if (!iqSlices.data || !meta) {
      return;
    }
    console.debug('minimap fetches complete', iqSlices.data);
    let iqData = {};
    iqSlices.data.forEach((slice: IQDataSlice) => {
      iqData[slice.index] = slice.iqArray;
    });

    // Check if all minimap fetches occurred

    // Loop through the samples we downloaded, calc FFT and produce spectrogram image
    const fftSizeScrollbar = iqData[Object.keys(iqData)[0]].length / 2; // just use the first one to find length
    const newScalingFactor = spectrogramHeight / fftSizeScrollbar / (skipNFfts + 1) / dataRange.length;
    setScalingFactor(newScalingFactor);
    // Find max/min magnitudes across entire minimap
    let minimumVal = Infinity;
    let maximumVal = -Infinity;
    let magnitudesBuffer = new Float64Array(fftSizeScrollbar * dataRange.length); // only typed arrays have set()
    dataRange.forEach((sampleIndex, i) => {
      const samples = iqData[sampleIndex];
      // Calc PSD
      const f = new FFT(fftSizeScrollbar);
      let out = f.createComplexArray(); // creates an empty array the length of fft.size*2
      f.transform(out, samples); // assumes input (2nd arg) is in form IQIQIQIQ and twice the length of fft.size
      out = out.map((x) => x / fftSizeScrollbar); // divide by fftsize
      let magnitudes = new Array(out.length / 2);
      for (let j = 0; j < out.length / 2; j++) {
        magnitudes[j] = Math.sqrt(Math.pow(out[j * 2], 2) + Math.pow(out[j * 2 + 1], 2)); // take magnitude
      }
      fftshift(magnitudes); // in-place
      magnitudes = magnitudes.map((x) => 10.0 * Math.log10(x)); // convert to dB
      magnitudes = magnitudes.map((x) => (isFinite(x) ? x : 0)); // get rid of -infinity which happens when the input is all 0s
      if (Math.min(...magnitudes) < minimumVal) minimumVal = Math.min(...magnitudes);
      if (Math.max(...magnitudes) > maximumVal) maximumVal = Math.max(...magnitudes);
      magnitudesBuffer.set(magnitudes, i * fftSizeScrollbar);
    });

    let minimapArray = new Uint8ClampedArray(fftSizeScrollbar * dataRange.length * 4);
    let startOfs = 0;
    console.debug('min/max', minimumVal, maximumVal);
    for (let i = 0; i < dataRange.length; i++) {
      let magnitudes = magnitudesBuffer.slice(i * fftSizeScrollbar, (i + 1) * fftSizeScrollbar);

      // apply magnitude min and max (which are in dB, same units as magnitudes prior to this point) and convert to 0-255
      const magnitude_max = maximumVal - 0; // dB
      props.setMagnitudeMax(magnitude_max);
      const magnitude_min = minimumVal + 20; // dB
      props.setMagnitudeMin(magnitude_min);
      const dbPer1 = 255 / (magnitude_max - magnitude_min);
      magnitudes = magnitudes.map((x) => x - magnitude_min);
      magnitudes = magnitudes.map((x) => x * dbPer1);
      magnitudes = magnitudes.map((x) => (x > 255 ? 255 : x)); // clip above 255
      magnitudes = magnitudes.map((x) => (x < 0 ? 0 : x)); // clip below 0
      let ipBuf8 = Uint8ClampedArray.from(magnitudes); // anything over 255 or below 0 at this point will become a random number, hence clipping above

      let lineOffset = i * fftSizeScrollbar * 4;
      for (let sigVal, opIdx = 0, ipIdx = startOfs; ipIdx < fftSizeScrollbar + startOfs; opIdx += 4, ipIdx++) {
        sigVal = ipBuf8[ipIdx] || 0; // if input line too short add zeros
        minimapArray[lineOffset + opIdx] = colorMap[sigVal][0]; // red
        minimapArray[lineOffset + opIdx + 1] = colorMap[sigVal][1]; // green
        minimapArray[lineOffset + opIdx + 2] = colorMap[sigVal][2]; // blue
        minimapArray[lineOffset + opIdx + 3] = 255; // alpha
      }
    }

    // Add a tick wherever there are annotations
    let t = [];
    meta.annotations.forEach((annotation) => {
      t.push({
        y: annotation['core:sample_start'] * newScalingFactor,
        height: annotation['core:sample_count'] * newScalingFactor,
      });
    });
    setTicks(t);

    // Render Image
    const imageData = new ImageData(minimapArray, fftSizeScrollbar, dataRange.length);
    createImageBitmap(imageData).then((ret) => {
      setMinimapImg(ret);
    });
  }, [iqSlices.data, colorMap]); // dont add anymore here, so that this triggers ONLY at the start

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
            width={scrollbarWidth}
            height={spectrogramHeight}
            strokeWidth={4}
            onClick={handleClick}
          ></Rect>
          <Rect
            x={0}
            y={handleTop}
            fill="black"
            width={scrollbarWidth}
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
        <Image image={minimapImg} x={0} y={0} width={scrollbarWidth} height={spectrogramHeight} />
        {/* This rect is invisible */}
        <Rect
          x={0}
          y={0}
          fill="grey"
          opacity={0}
          width={scrollbarWidth}
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
          width={scrollbarWidth}
          height={handleHeightPixels}
          draggable={true}
          onDragMove={handleDragMove}
        ></Rect>

        {/* box for each annotation */}
        {ticks.map((tick, index) => (
          <Rect
            x={0}
            y={tick.y}
            width={7}
            height={tick.height}
            fillEnabled={true}
            fill="white"
            stroke="black"
            strokeWidth={2}
            key={'annotation' + index.toString()}
          />
        ))}

        {/* white boxes showing what has been downloaded */}
        {downloadedTiles.map((tile, index) => (
          <Rect
            x={scrollbarWidth}
            y={parseInt(tile) * TILE_SIZE_IN_IQ_SAMPLES * scalingFactor}
            width={5}
            height={TILE_SIZE_IN_IQ_SAMPLES * scalingFactor}
            fillEnabled={true}
            fill="white"
            stroke="black"
            strokeWidth={0}
            key={Math.random() * 1000000 + Math.random()}
          />
        ))}
      </Layer>
    </>
  );
};

export default ScrollBar;
