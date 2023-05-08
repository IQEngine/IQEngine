// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect } from 'react';
import { Layer, Rect, Image } from 'react-konva';
import { fftshift } from 'fftshift';
import { colMap } from '../../Utils/colormap';
import { MINIMUM_SCROLL_HANDLE_HEIGHT_PIXELS, TILE_SIZE_IN_IQ_SAMPLES } from '../../Utils/constants';

const FFT = require('fft.js');

const ScrollBar = (props) => {
  let {
    totalIQSamples,
    spectrogramHeight,
    fetchAndRender,
    fftSize,
    minimapNumFetches,
    meta,
    skipNFfts,
    size,
    downloadedTiles,
  } = props;

  const [minimapImg, setMinimapImg] = useState(null);
  //const [scrollbarWidth, setStageWidth] = useState(50);
  const scrollbarWidth = 50;
  const [y, setY] = useState(0);
  const [ticks, setTicks] = useState([]);
  const [handleHeightPixels, setHandleHeightPixels] = useState();
  const [scalingFactor, setScalingFactor] = useState();

  // Calc scroll handle height
  useEffect(() => {
    let x = (spectrogramHeight / (totalIQSamples / fftSize)) * spectrogramHeight;
    if (x < MINIMUM_SCROLL_HANDLE_HEIGHT_PIXELS) x = MINIMUM_SCROLL_HANDLE_HEIGHT_PIXELS;
    setHandleHeightPixels(x);
  }, [spectrogramHeight, totalIQSamples, fftSize]);

  // This only runs once, once all the minimap fetches have occured
  useEffect(() => {
    if (!minimapNumFetches) {
      return;
    }
    // Check if all minimap fetches occured
    if (
      Object.keys(window.iqData)
        .map((x) => x.includes('minimap'))
        .filter(Boolean).length === minimapNumFetches
    ) {
      // First refresh the spectrogram (not minimap) data since the maxFft and minFft will be better estimates by the time the minimap data is fetched
      // TODO: it's messy to have behavior unrelated to the minimap here, just because the minimap loading is a convinient way to delay a bit
      window.fftData = {};
      props.fetchAndRender(0);

      // Loop through the samples we downloaded, calc FFT and produce spectrogram image
      const fftSizeScrollbar = window.iqData['minimap0'].length / 2; // just use the first one to find length
      const newScalingFactor = spectrogramHeight / fftSizeScrollbar / (skipNFfts + 1) / minimapNumFetches;
      setScalingFactor(newScalingFactor);
      let magnitudesBuffer = new Float64Array(fftSizeScrollbar * minimapNumFetches); // only typed arrays have set()
      for (let i = 0; i < minimapNumFetches; i++) {
        const samples = window.iqData['minimap' + i.toString()];
        // Calc PSD
        const f = new FFT(fftSizeScrollbar);
        const out = f.createComplexArray(); // creates an empty array the length of fft.size*2
        f.transform(out, samples); // assumes input (2nd arg) is in form IQIQIQIQ and twice the length of fft.size
        let magnitudes = new Array(out.length / 2);
        for (let j = 0; j < out.length / 2; j++) {
          magnitudes[j] = Math.sqrt(Math.pow(out[j * 2], 2) + Math.pow(out[j * 2 + 1], 2)); // take magnitude
        }
        fftshift(magnitudes); // in-place
        magnitudes = magnitudes.map((x) => 10.0 * Math.log10(x)); // convert to dB
        magnitudesBuffer.set(magnitudes, i * fftSizeScrollbar);
      }

      // Find max/min magnitudes across entire minimap
      const maximumVal = Math.max(...magnitudesBuffer);
      const minimumVal = Math.min(...magnitudesBuffer);

      let minimap = new Uint8ClampedArray(fftSizeScrollbar * minimapNumFetches * 4);
      let startOfs = 0;
      for (let i = 0; i < minimapNumFetches; i++) {
        let magnitudes = magnitudesBuffer.slice(i * fftSizeScrollbar, (i + 1) * fftSizeScrollbar);
        // convert to 0 - 255
        magnitudes = magnitudes.map((x) => x - minimumVal); // lowest value is now 0
        magnitudes = magnitudes.map((x) => x / (maximumVal - minimumVal)); // highest value is now 1
        magnitudes = magnitudes.map((x) => x * 255); // now from 0 to 255

        // apply magnitude min and max
        const magnitudeMax = 240;
        const magnitudeMin = 80;
        magnitudes = magnitudes.map((x) => x / ((magnitudeMax - magnitudeMin) / 255));
        magnitudes = magnitudes.map((x) => x - magnitudeMin);

        // Clip from 0 to 255 and convert to ints
        magnitudes = magnitudes.map((x) => (x > 255 ? 255 : x)); // clip above 255
        magnitudes = magnitudes.map((x) => (x < 0 ? 0 : x)); // clip below 0
        let ipBuf8 = Uint8ClampedArray.from(magnitudes); // anything over 255 or below 0 at this point will become a random number
        let lineOffset = i * fftSizeScrollbar * 4;
        for (let sigVal, rgba, opIdx = 0, ipIdx = startOfs; ipIdx < fftSizeScrollbar + startOfs; opIdx += 4, ipIdx++) {
          sigVal = ipBuf8[ipIdx] || 0; // if input line too short add zeros
          rgba = colMap[sigVal]; // array of rgba values
          // byte reverse so number aa bb gg rr
          minimap[lineOffset + opIdx] = rgba[0]; // red
          minimap[lineOffset + opIdx + 1] = rgba[1]; // green
          minimap[lineOffset + opIdx + 2] = rgba[2]; // blue
          minimap[lineOffset + opIdx + 3] = rgba[3]; // alpha
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
      const imageData = new ImageData(minimap, fftSizeScrollbar, minimapNumFetches);
      createImageBitmap(imageData).then((ret) => {
        setMinimapImg(ret);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, minimapNumFetches]); // dont add anymore here, so that this triggers ONLY at the start

  const handleClick = (e) => {
    let currentY = e.evt.offsetY;
    let newY = currentY - handleHeightPixels / 2; // assume we want the handle centered where we click but we have to send fetchAndRender the top of the handle
    if (newY < 0) {
      newY = 0;
    }
    if (newY > spectrogramHeight - handleHeightPixels) {
      newY = spectrogramHeight - handleHeightPixels;
    }
    setY(newY);
    props.fetchAndRender(newY);
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
    setY(newY);
    fetchAndRender(y);
  };

  if (!minimapImg) {
    return (
      <>
        <Layer>
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
            y={y}
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
      <Layer>
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
      <Layer>
        <Rect
          x={0}
          y={y}
          fill="black"
          opacity={0.6}
          width={scrollbarWidth}
          height={handleHeightPixels}
          draggable={true}
          onDragMove={handleDragMove}
        ></Rect>
        {ticks.map((tick, index) => (
          <Rect
            x={0}
            y={tick.y}
            width={7}
            height={tick.height}
            fillEnabled="true"
            fill="white"
            stroke="black"
            strokeWidth={2}
            key={'annotation' + index.toString()}
          />
        ))}

        {downloadedTiles.map((tile, index) => (
          <Rect
            x={scrollbarWidth}
            y={parseInt(tile) * TILE_SIZE_IN_IQ_SAMPLES * scalingFactor}
            width={10}
            height={TILE_SIZE_IN_IQ_SAMPLES * scalingFactor}
            fillEnabled="true"
            fill="white"
            stroke="black"
            strokeWidth={0}
            key={tile}
          />
        ))}
      </Layer>
    </>
  );
};

export default ScrollBar;
