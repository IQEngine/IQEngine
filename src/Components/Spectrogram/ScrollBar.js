// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState, useEffect } from 'react';
import { Layer, Rect, Image } from 'react-konva';
import { fftshift } from 'fftshift';
import { colMap } from '../../Utils/colormap';
import { MINIMUM_SCROLL_HANDLE_HEIGHT } from '../../Utils/constants';

const FFT = require('fft.js');

const ScrollBar = (props) => {
  let {
    totalBytes,
    spectrogram_height,
    fetchAndRender,
    bytesPerSample,
    fftSize,
    minimapNumFetches,
    rulerSideWidth,
    meta,
    skipNFfts,
    size,
  } = props;

  const [minimapImg, setMinimapImg] = useState(null);
  const [scrollbarWidth, setStageWidth] = useState(50);
  const [y, setY] = useState(0);
  const [ticks, setTicks] = useState([]);
  const [handleHeightPixels, setHandleHeightPixels] = useState();

  // Calc scroll handle height
  useEffect(() => {
    let x = (spectrogram_height / (totalBytes / bytesPerSample / 2 / fftSize)) * spectrogram_height;
    if (x < MINIMUM_SCROLL_HANDLE_HEIGHT) x = MINIMUM_SCROLL_HANDLE_HEIGHT;
    setHandleHeightPixels(x);
  }, [spectrogram_height, totalBytes, bytesPerSample, fftSize]);

  useEffect(() => {
    if (!minimapNumFetches) {
      return;
    }
    // Check if all minimap fetches occured
    if (
      Object.keys(window.iq_data)
        .map((x) => x.includes('minimap'))
        .filter(Boolean).length === minimapNumFetches
    ) {
      // First refresh the spectrogram (not minimap) data since the maxFft and minFft will be better estimates by the time the minimap data is fetched
      window.fft_data = {};
      props.fetchAndRender(0);

      // Loop through the samples we downloaded, calc FFT and produce spectrogram image
      const fft_size = window.iq_data['minimap0'].length / 2; // just use the first one to find length
      let magnitudesBuffer = new Float64Array(fft_size * minimapNumFetches); // only typed arrays have set()
      for (let i = 0; i < minimapNumFetches; i++) {
        const samples = window.iq_data['minimap' + i.toString()];
        // Calc PSD
        const f = new FFT(fft_size);
        const out = f.createComplexArray(); // creates an empty array the length of fft.size*2
        f.transform(out, samples); // assumes input (2nd arg) is in form IQIQIQIQ and twice the length of fft.size
        let magnitudes = new Array(out.length / 2);
        for (let j = 0; j < out.length / 2; j++) {
          magnitudes[j] = Math.sqrt(Math.pow(out[j * 2], 2) + Math.pow(out[j * 2 + 1], 2)); // take magnitude
        }
        fftshift(magnitudes); // in-place
        magnitudes = magnitudes.map((x) => 10.0 * Math.log10(x)); // convert to dB
        magnitudesBuffer.set(magnitudes, i * fft_size);
      }

      // Find max/min magnitudes across entire minimap
      const maximum_val = Math.max(...magnitudesBuffer);
      const minimum_val = Math.min(...magnitudesBuffer);

      const clearBuf = new ArrayBuffer(fft_size * minimapNumFetches * 4); // fills with 0s ie. rgba 0,0,0,0 = transparent
      let minimap = new Uint8ClampedArray(clearBuf);
      let startOfs = 0;
      for (let i = 0; i < minimapNumFetches; i++) {
        let magnitudes = magnitudesBuffer.slice(i * fft_size, (i + 1) * fft_size);
        // convert to 0 - 255
        magnitudes = magnitudes.map((x) => x - minimum_val); // lowest value is now 0
        magnitudes = magnitudes.map((x) => x / maximum_val); // highest value is now 1
        magnitudes = magnitudes.map((x) => x * 255); // now from 0 to 255

        // apply magnitude min and max
        const magnitude_max = 240;
        const magnitude_min = 100;
        magnitudes = magnitudes.map((x) => x / ((magnitude_max - magnitude_min) / 255));
        magnitudes = magnitudes.map((x) => x - magnitude_min);

        // Clip from 0 to 255 and convert to ints
        magnitudes = magnitudes.map((x) => (x > 255 ? 255 : x)); // clip above 255
        magnitudes = magnitudes.map((x) => (x < 0 ? 0 : x)); // clip below 0
        let ipBuf8 = Uint8ClampedArray.from(magnitudes); // anything over 255 or below 0 at this point will become a random number
        let line_offset = i * fft_size * 4;
        for (let sigVal, rgba, opIdx = 0, ipIdx = startOfs; ipIdx < fft_size + startOfs; opIdx += 4, ipIdx++) {
          sigVal = ipBuf8[ipIdx] || 0; // if input line too short add zeros
          rgba = colMap[sigVal]; // array of rgba values
          // byte reverse so number aa bb gg rr
          minimap[line_offset + opIdx] = rgba[0]; // red
          minimap[line_offset + opIdx + 1] = rgba[1]; // green
          minimap[line_offset + opIdx + 2] = rgba[2]; // blue
          minimap[line_offset + opIdx + 3] = rgba[3]; // alpha
        }
      }

      // Add a tick wherever there are annotations
      let t = [];
      meta.annotations.forEach((annotation) => {
        t.push({
          y: (annotation['core:sample_start'] / fft_size / (skipNFfts + 1) / minimapNumFetches) * spectrogram_height,
          height:
            (annotation['core:sample_count'] / fft_size / (skipNFfts + 1) / minimapNumFetches) * spectrogram_height,
        });
      });
      setTicks(t);

      // Render Image
      const image_data = new ImageData(minimap, fft_size, minimapNumFetches);
      createImageBitmap(image_data).then((ret) => {
        setMinimapImg(ret);
      });
    }
  }, [size, minimapNumFetches]); // dont add anymore here, so that this triggers ONLY after each fetch happens

  const handleClick = (e) => {
    let currentY = e.evt.offsetY;
    let newY = currentY - handleHeightPixels / 2;
    if (newY < 0) {
      newY = 0;
    }
    if (newY > spectrogram_height - handleHeightPixels) {
      newY = spectrogram_height - handleHeightPixels;
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
    if (newY > spectrogram_height - handleHeightPixels) {
      e.target.y(spectrogram_height - handleHeightPixels);
      newY = spectrogram_height - handleHeightPixels;
    }
    e.target.x(rulerSideWidth);
    setY(newY);
    fetchAndRender(y);
  };

  if (!minimapImg) {
    return (
      <>
        <Layer>
          <Rect
            x={rulerSideWidth}
            y={0}
            fill="grey"
            width={scrollbarWidth}
            height={spectrogram_height}
            strokeWidth={4}
            onClick={handleClick}
          ></Rect>
          <Rect
            x={rulerSideWidth}
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
        <Image image={minimapImg} x={rulerSideWidth} y={0} width={scrollbarWidth} height={spectrogram_height} />
        {/* This rect is invisible */}
        <Rect
          x={rulerSideWidth}
          y={0}
          fill="grey"
          opacity={0}
          width={scrollbarWidth}
          height={spectrogram_height}
          strokeWidth={4}
          onClick={handleClick}
        ></Rect>
      </Layer>
      <Layer>
        <Rect
          x={rulerSideWidth}
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
            x={rulerSideWidth}
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
      </Layer>
    </>
  );
};

export default ScrollBar;
