// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

/*
stage0 - raw IQ straight from the recording
stage1 - pre-FFT processing performed on stage1, eg FIR filter, python snippet
stage2 - FFT output in floats, in units of dB
stage3 - after doing decimation (max, mean, or skip) for zooming out in time
stage4 - uint8 values after having the min/max and colormap applied
*/

// @ts-ignore
import { fftshift } from 'fftshift';
import { TILE_SIZE_IN_IQ_SAMPLES } from './constants';
import { FFT } from '@/utils/fft';
import { SigMFMetadata } from './sigmfMetadata';

export function calcFftOfTile(samples: Float32Array, fftSize: number, windowFunction: string) {
  //let startTime = performance.now();
  let fftsConcatenated = new Float32Array(TILE_SIZE_IN_IQ_SAMPLES);

  // loop through each row
  for (let i = 0; i < TILE_SIZE_IN_IQ_SAMPLES / fftSize; i++) {
    let samples_slice = samples.slice(i * fftSize * 2, (i + 1) * fftSize * 2); // mult by 2 because this is int/floats not IQ samples

    // Apply a hamming window and hanning window
    if (windowFunction === 'hamming') {
      for (let window_i = 0; window_i < fftSize; window_i++) {
        samples_slice[window_i] =
          samples_slice[window_i] * (0.54 - 0.46 * Math.cos((2 * Math.PI * window_i) / (fftSize - 1)));
      }
    } else if (windowFunction === 'hanning') {
      for (let window_i = 0; window_i < fftSize; window_i++) {
        samples_slice[window_i] =
          samples_slice[window_i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * window_i) / (fftSize - 1)));
      }
    } else if (windowFunction === 'bartlett') {
      for (let window_i = 0; window_i < fftSize; window_i++) {
        samples_slice[window_i] =
          samples_slice[window_i] *
          ((2 / (fftSize - 1)) * ((fftSize - 1) / 2) - Math.abs(window_i - (fftSize - 1) / 2));
      }
    } else if (windowFunction === 'blackman') {
      for (let window_i = 0; window_i < fftSize; window_i++) {
        samples_slice[window_i] =
          samples_slice[window_i] *
          (0.42 -
            0.5 * Math.cos((2 * Math.PI * window_i) / fftSize) +
            0.08 * Math.cos((4 * Math.PI * window_i) / fftSize));
      }
    }

    const f = new FFT(fftSize);
    let out = f.createComplexArray(); // creates an empty array the length of fft.size*2
    f.transform(out, samples_slice); // assumes input (2nd arg) is in form IQIQIQIQ and twice the length of fft.size

    out = out.map((x) => x / fftSize); // divide by fftsize

    // convert to magnitude
    let magnitudes = new Array(out.length / 2);
    for (let j = 0; j < out.length / 2; j++) {
      magnitudes[j] = Math.sqrt(Math.pow(out[j * 2], 2) + Math.pow(out[j * 2 + 1], 2)); // take magnitude
    }

    fftshift(magnitudes); // in-place
    magnitudes = magnitudes.map((x) => 10.0 * Math.log10(x)); // convert to dB
    magnitudes = magnitudes.map((x) => (isFinite(x) ? x : 0)); // get rid of -infinity which happens when the input is all 0s

    fftsConcatenated.set(magnitudes, i * fftSize);
  }
  //let endTime = performance.now();
  //console.debug('Calculating FFTs took', endTime - startTime, 'milliseconds'); // first cut of our code processed+rendered 0.5M samples in 760ms on marcs computer
  return fftsConcatenated;
}

export function fftToRGB(
  fftsConcatenated: Float32Array,
  fftSize: number,
  magnitude_min: number,
  magnitude_max: number,
  colMap: any
) {
  let startOfs = 0;
  let newFftData = new Uint8ClampedArray(fftsConcatenated.length * 4); // 4 because RGBA

  if (fftsConcatenated[0] === Number.NEGATIVE_INFINITY) {
    newFftData.fill(255);
    return newFftData;
  }

  // loop through each row
  for (let i = 0; i < fftsConcatenated.length / fftSize; i++) {
    let magnitudes = fftsConcatenated.slice(i * fftSize, (i + 1) * fftSize);

    if (magnitudes[0] === Number.NEGATIVE_INFINITY) {
      newFftData.fill(255, i * fftSize * 4, (i + 1) * fftSize * 4);
      continue;
    }

    // apply magnitude min and max (which are in dB, same units as magnitudes prior to this point) and convert to 0-255
    const dbPer1 = 255 / (magnitude_max - magnitude_min);
    magnitudes = magnitudes.map((x) => x - magnitude_min);
    magnitudes = magnitudes.map((x) => x * dbPer1);
    magnitudes = magnitudes.map((x) => (x > 255 ? 255 : x)); // clip above 255
    magnitudes = magnitudes.map((x) => (x < 0 ? 0 : x)); // clip below 0
    let ipBuf8 = Uint8ClampedArray.from(magnitudes); // anything over 255 or below 0 at this point will become a random number, hence clipping above

    // Apply colormap
    let line_offset = i * fftSize * 4;
    for (let sigVal, opIdx = 0, ipIdx = startOfs; ipIdx < fftSize + startOfs; opIdx += 4, ipIdx++) {
      sigVal = ipBuf8[ipIdx] || 0; // if input line too short add zeros
      newFftData[line_offset + opIdx] = colMap[sigVal][0]; // red
      newFftData[line_offset + opIdx + 1] = colMap[sigVal][1]; // green
      newFftData[line_offset + opIdx + 2] = colMap[sigVal][2]; // blue
      newFftData[line_offset + opIdx + 3] = 255; // alpha
    }
  }
  return newFftData;
}

export interface SelectFftReturn {
  imageData: any;
  missingTiles: Array<number>;
  fftData: Record<number, Float32Array>;
}

// lowerTile and upperTile are in fractions of a tile
export const selectFft = (
  lowerTile: number,
  upperTile: number,
  fftSize: number, // in units of IQ samples
  magnitudeMax: number,
  magnitudeMin: number,
  meta: SigMFMetadata,
  windowFunction: any,
  zoomLevel: any,
  iqData: Record<number, Float32Array>,
  fftData: Record<number, Float32Array>,
  colMap: any
): SelectFftReturn | null => {
  if (!meta || !iqData) {
    return;
  }

  // Go through each of the tiles and compute the FFT and convert to RGB
  const tiles = range(Math.floor(lowerTile), Math.ceil(upperTile));
  for (let tile of tiles) {
    if (!!fftData[tile]) {
      continue;
    }
    if (!iqData[tile]) {
      console.debug('Dont have iqData of tile', tile, 'yet');
      continue;
    }
    let samples = iqData[tile.toString()];

    fftData[tile] = calcFftOfTile(samples, fftSize, windowFunction);
  }

  // Concatenate the full tiles
  let totalFftData = new Float32Array(tiles.length * TILE_SIZE_IN_IQ_SAMPLES);
  const missingTiles = [];
  for (let [index, tile] of tiles.entries()) {
    if (tile in fftData) {
      totalFftData.set(fftData[tile], index * TILE_SIZE_IN_IQ_SAMPLES);
    } else {
      // If the tile isnt available, fill with 0's (white and opaque)
      missingTiles.push(tile);
      totalFftData.fill(-Infinity, index * TILE_SIZE_IN_IQ_SAMPLES, (index + 1) * TILE_SIZE_IN_IQ_SAMPLES);
    }
  }

  // Trim off the top and bottom
  let lowerTrim = (lowerTile - Math.floor(lowerTile)) * TILE_SIZE_IN_IQ_SAMPLES; // amount we want to get rid of
  lowerTrim = lowerTrim - (lowerTrim % fftSize); // make it an even FFT size. TODO We need this rounding to happen earlier, so we get a consistent 600 ffts in the image
  let upperTrim = (1 - (upperTile - Math.floor(upperTile))) * TILE_SIZE_IN_IQ_SAMPLES; // amount we want to get rid of
  upperTrim = upperTrim - (upperTrim % fftSize);
  let trimmedFftData = totalFftData.slice(lowerTrim, totalFftData.length - upperTrim); // totalFftData.length already includes the *4
  let num_final_ffts = trimmedFftData.length / fftSize;

  // zoomLevel portion (decimate by N)
  if (zoomLevel !== 1) {
    num_final_ffts = Math.floor(num_final_ffts / zoomLevel);
    console.debug(num_final_ffts);
    let zoomedFftData = new Float32Array(num_final_ffts * fftSize);
    zoomedFftData.fill(-Infinity);
    if (zoomLevel >= 2 && zoomLevel <= 10) {
      // max pooling
      for (let i = 0; i < num_final_ffts; i++) {
        for (let j = 0; j < fftSize; j++) {
          for (let k = 0; k < zoomLevel; k++) {
            if (trimmedFftData[(i * zoomLevel + k) * fftSize + j] > zoomedFftData[i * fftSize + j]) {
              zoomedFftData[i * fftSize + j] = trimmedFftData[(i * zoomLevel + k) * fftSize + j];
            }
          }
        }
      }
    } else {
      // skip
      for (let i = 0; i < num_final_ffts; i++) {
        zoomedFftData.set(
          trimmedFftData.slice(i * zoomLevel * fftSize, (i * zoomLevel + 1) * fftSize),
          i * fftSize // item offset for this data to be inserted
        );
      }
    }

    trimmedFftData = zoomedFftData;
  }
  const rgbData = fftToRGB(trimmedFftData, fftSize, magnitudeMin, magnitudeMax, colMap);

  // Render Image
  const imageData = new ImageData(rgbData, fftSize, num_final_ffts);

  let selectFftReturn = {
    imageData: imageData,
    missingTiles: missingTiles,
    fftData: fftData,
  };
  return selectFftReturn;
};

export function calculateTileNumbers(
  handleTop: any,
  totalIQSamples: any,
  fftSize: any,
  spectrogramHeight: any,
  zoomLevel: any
) {
  const fftsOnScreen = spectrogramHeight * zoomLevel; // remember, we are assuming that 1 row of pixels = 1 FFT, times zoomLevel
  const fftsPerTile = TILE_SIZE_IN_IQ_SAMPLES / fftSize;
  const fractionIntoFile = handleTop / spectrogramHeight; // because of the way the scrollbar works and is always same height as spectrogram

  // Find which tiles are within view (in units of tiles incl fraction)
  const lowerTile = (totalIQSamples * fractionIntoFile) / TILE_SIZE_IN_IQ_SAMPLES;
  const upperTile = fftsOnScreen / fftsPerTile + lowerTile;

  console.debug('lowerTile:', lowerTile, 'upperTile:', upperTile);
  return { lowerTile: lowerTile, upperTile: upperTile };
}

// mimicing python's range() function which gives array of integers between two values non-inclusive of end
export function range(start: number, end: number): number[] {
  return Array.apply(0, Array(end - start)).map((element, index) => index + start);
}

export function dataTypeToBytesPerSample(dataType: any): number {
  let bytesPerSample = 1;
  if (dataType.includes('8')) {
    bytesPerSample = 1;
  } else if (dataType.includes('16')) {
    bytesPerSample = 2;
  } else if (dataType.includes('32')) {
    bytesPerSample = 4;
  } else if (dataType.includes('64')) {
    bytesPerSample = 8;
  } else {
    console.error('unsupported datatype');
  }
  return bytesPerSample;
}
