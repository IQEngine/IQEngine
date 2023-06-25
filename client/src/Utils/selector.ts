// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

// @ts-ignore
import { fftshift } from 'fftshift';
import { TILE_SIZE_IN_IQ_SAMPLES } from './constants';
import { FFT } from '@/Utils/fft';
import { SigMFMetadata } from './sigmfMetadata';

function getStandardDeviation(array: Array<any>) {
  const n = array.length;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
}

const average = (array: Array<any>) => array.reduce((a, b) => a + b) / array.length;

export function calcFftOfTile(
  samples: Float32Array,
  fftSize: number,
  numFftsPerTile: number,
  windowFunction: string,
  magnitude_min: number,
  magnitude_max: number,
  autoscale: boolean,
  colMap: any
) {
  let startTime = performance.now();
  let newFftData = new Uint8ClampedArray(fftSize * numFftsPerTile * 4); // 4 because RGBA
  let startOfs = 0;
  let autoMin;
  let autoMax;

  // loop through each row
  for (let i = 0; i < numFftsPerTile; i++) {
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

    // When you click the button this code will run once, then it will turn itself off until you click it again
    if (autoscale) {
      // get the last calculated standard deviation and mean calculated from this loop and define the auto magnitude of min and max
      const std = getStandardDeviation(magnitudes);
      const mean = magnitudes.reduce((a, b) => a + b) / magnitudes.length;
      // TODO: for now we're just going to use whatever the last FFT row's value is for min/max
      autoMin = mean - 1.5 * std;
      autoMax = mean + 1.5 * std;
      if (autoMin < 1) {
        autoMin = 1; // recall there was a bug with setting min to 0
      }
      if (autoMax > 255) {
        autoMax = 255;
      }
      // It's a bit ugly with a dozen decimal places, so round to 3
      autoMax = Math.round(autoMax * 1000) / 1000;
      autoMin = Math.round(autoMin * 1000) / 1000;
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
  let endTime = performance.now();
  console.debug('Rendering spectrogram took', endTime - startTime, 'milliseconds'); // first cut of our code processed+rendered 0.5M samples in 760ms on marcs computer
  return {
    newFftData: newFftData,
    autoMax: autoMax,
    autoMin: autoMin,
  };
}

export interface SelectFftReturn {
  imageData: any;
  autoMax: number;
  autoMin: number;
  missingTiles: Array<number>;
  fftData: Record<number, Uint8ClampedArray>;
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
  autoscale = false,
  zoomLevel: any,
  iqData: Record<number, Float32Array>,
  fftData: Record<number, Uint8ClampedArray>,
  colMap: any
): SelectFftReturn | null => {
  if (!meta || !iqData) {
    return;
  }

  const numFftsPerTile = TILE_SIZE_IN_IQ_SAMPLES / fftSize;
  let magnitude_max = magnitudeMax;
  let magnitude_min = magnitudeMin;

  // Go through each of the tiles and compute the FFT and save in window.fftData
  const tiles = range(Math.floor(lowerTile), Math.ceil(upperTile));
  let autoMaxs = [];
  let autoMins = [];
  for (let tile of tiles) {
    if (!!fftData[tile]) {
      continue;
    }
    if (!iqData[tile]) {
      console.debug('Dont have iqData of tile', tile, 'yet');
      continue;
    }
    let samples = iqData[tile.toString()];
    const { newFftData, autoMax, autoMin } = calcFftOfTile(
      samples,
      fftSize,
      numFftsPerTile,
      windowFunction,
      magnitude_min,
      magnitude_max,
      autoscale,
      colMap
    );
    autoMaxs.push(autoMax);
    autoMins.push(autoMin);
    fftData[tile] = newFftData;
  }
  const missingTiles = [];
  // Concatenate the full tiles
  let totalFftData = new Uint8ClampedArray(tiles.length * fftSize * numFftsPerTile * 4); // 4 because RGBA
  let counter = 0; // can prob make this cleaner with an iterator in the for loop below
  for (let tile of tiles) {
    if (tile in fftData) {
      totalFftData.set(fftData[tile], counter);
    } else {
      missingTiles.push(tile);
      // If the tile isnt available, fill with ones (white)
      let fakeFftData = new Uint8ClampedArray(fftSize * numFftsPerTile * 4);
      fakeFftData.fill(255); // for debugging its better to have the alpha set to opaque so the missing part isnt invisible
      totalFftData.set(fakeFftData, counter);
    }
    counter = counter + fftSize * numFftsPerTile * 4;
  }

  // Trim off the top and bottom
  let lowerTrim = (lowerTile - Math.floor(lowerTile)) * fftSize * numFftsPerTile; // amount we want to get rid of
  lowerTrim = lowerTrim - (lowerTrim % fftSize); // make it an even FFT size. TODO We need this rounding to happen earlier, so we get a consistent 600 ffts in the image
  let upperTrim = (1 - (upperTile - Math.floor(upperTile))) * fftSize * numFftsPerTile; // amount we want to get rid of
  upperTrim = upperTrim - (upperTrim % fftSize);
  let trimmedFftData = totalFftData.slice(lowerTrim * 4, totalFftData.length - upperTrim * 4); // totalFftData.length already includes the *4
  let num_final_ffts = trimmedFftData.length / fftSize / 4;

  // zoomLevel portion (decimate by N)
  if (zoomLevel !== 1) {
    num_final_ffts = Math.floor(num_final_ffts / zoomLevel);
    console.debug(num_final_ffts);
    let zoomedFftData = new Uint8ClampedArray(num_final_ffts * fftSize * 4);
    // loop through ffts
    for (let i = 0; i < num_final_ffts; i++) {
      zoomedFftData.set(
        trimmedFftData.slice(i * zoomLevel * fftSize * 4, (i * zoomLevel + 1) * fftSize * 4),
        i * fftSize * 4 // item offset for this data to be inserted
      );
    }
    trimmedFftData = zoomedFftData;
  }

  // Render Image
  const imageData = new ImageData(trimmedFftData, fftSize, num_final_ffts);

  let selectFftReturn = {
    imageData: imageData,
    autoMax: autoMaxs.length ? average(autoMaxs) : 255,
    autoMin: autoMins.length ? average(autoMins) : 0,
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
