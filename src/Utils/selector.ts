// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

// @ts-ignore
import { fftshift } from 'fftshift';
import { colMap } from './colormap';
import { TILE_SIZE_IN_IQ_SAMPLES } from './constants';
import { FFT } from '@/Utils/fft';

declare global {
  interface Window {
    fftData: any;
    annotations: Array<any>;
    sampleRate: number;
    iqData: any;
  }
}

window.fftData = {}; // this is where our FFT outputs are stored
window.annotations = []; // gets filled in before return
window.sampleRate = 1; // will get filled in

// This will get called when we go to a new spectrogram page
export const clearAllData = () => {
  window.fftData = {}; // this is where our FFT outputs are stored
  window.annotations = []; // gets filled in before return
  window.sampleRate = 1; // will get filled in
  window.iqData = {}; // initialized in blobSlice.js but we have to clear it each time we go to another spectrogram page
};

function getStandardDeviation(array: Array<any>) {
  const n = array.length;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
}

const average = (array: Array<any>) => array.reduce((a, b) => a + b) / array.length;

function calcFftOfTile(
  samples: any,
  fftSize: any,
  numFftsPerTile: any,
  windowFunction: any,
  magnitude_min: any,
  magnitude_max: any,
  autoscale: any,
  currentFftMax: any,
  currentFftMin: any
) {
  let startTime = performance.now();
  let newFftData = new Uint8ClampedArray(fftSize * numFftsPerTile * 4); // 4 because RGBA
  let startOfs = 0;
  let autoMin;
  let autoMax;
  let tempCurrentFftMax = currentFftMax;
  let tempCurrentFftMin = currentFftMin;

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
    const out = f.createComplexArray(); // creates an empty array the length of fft.size*2
    f.transform(out, samples_slice); // assumes input (2nd arg) is in form IQIQIQIQ and twice the length of fft.size
    let magnitudes = new Array(out.length / 2);
    for (let j = 0; j < out.length / 2; j++) {
      magnitudes[j] = Math.sqrt(Math.pow(out[j * 2], 2) + Math.pow(out[j * 2 + 1], 2)); // take magnitude
    }
    fftshift(magnitudes); // in-place

    magnitudes = magnitudes.map((x) => 10.0 * Math.log10(x)); // convert to dB

    const tempFftMax = Math.max(...magnitudes);
    if (tempFftMax > tempCurrentFftMax) tempCurrentFftMax = tempFftMax;
    const tempFftMin = Math.min(...magnitudes);
    if (tempFftMin < tempCurrentFftMin) tempCurrentFftMin = tempFftMin;

    // convert to 0 - 255
    magnitudes = magnitudes.map((x) => x - tempCurrentFftMin); // lowest value is now 0
    magnitudes = magnitudes.map((x) => x / (tempCurrentFftMax - tempCurrentFftMin)); // highest value is now 1
    magnitudes = magnitudes.map((x) => x * 255); // now from 0 to 255

    // To leave some margin to go above max and below min, scale it to 50 to 200 for now
    magnitudes = magnitudes.map((x) => x * 0.588 + 50); // 0.588 is (200-50)/255

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

    // apply magnitude min and max
    magnitudes = magnitudes.map((x) => x / ((magnitude_max - magnitude_min) / 255));
    magnitudes = magnitudes.map((x) => x - magnitude_min);

    // Clip from 0 to 255 and convert to ints
    magnitudes = magnitudes.map((x) => (x > 255 ? 255 : x)); // clip above 255
    magnitudes = magnitudes.map((x) => (x < 0 ? 0 : x)); // clip below 0
    let ipBuf8 = Uint8ClampedArray.from(magnitudes); // anything over 255 or below 0 at this point will become a random number, hence clipping above

    // Apply colormap
    let line_offset = i * fftSize * 4;
    for (let sigVal, rgba, opIdx = 0, ipIdx = startOfs; ipIdx < fftSize + startOfs; opIdx += 4, ipIdx++) {
      sigVal = ipBuf8[ipIdx] || 0; // if input line too short add zeros
      rgba = colMap[sigVal]; // array of rgba values
      // byte reverse so number aa bb gg rr
      newFftData[line_offset + opIdx] = rgba[0]; // red
      newFftData[line_offset + opIdx + 1] = rgba[1]; // green
      newFftData[line_offset + opIdx + 2] = rgba[2]; // blue
      newFftData[line_offset + opIdx + 3] = rgba[3]; // alpha
    }
  }
  let endTime = performance.now();
  console.log('Rendering spectrogram took', endTime - startTime, 'milliseconds'); // first cut of our code processed+rendered 0.5M samples in 760ms on marcs computer
  return {
    newFftData: newFftData,
    autoMax: autoMax,
    autoMin: autoMin,
    newCurrentFftMax: tempCurrentFftMax,
    newCurrentFftMin: tempCurrentFftMin,
  };
}

// lowerTile and upperTile are in fractions of a tile
export const selectFft = (
  lowerTile: any,
  upperTile: any,
  fftSize: any, // in units of IQ samples
  magnitudeMax: any,
  magnitudeMin: any,
  meta: any,
  windowFunction: any,
  currentFftMax: any,
  currentFftMin: any,
  spectrogramHeight: any,
  autoscale = false
) => {
  const numFftsPerTile = TILE_SIZE_IN_IQ_SAMPLES / fftSize;
  let magnitude_max = magnitudeMax;
  let magnitude_min = magnitudeMin;
  let tempCurrentFftMax = currentFftMax;
  let tempCurrentFftMin = currentFftMin;

  // Go through each of the tiles and compute the FFT and save in window.fftData
  const tiles = range(Math.floor(lowerTile), Math.floor(upperTile) + 1);
  let autoMaxs = [];
  let autoMins = [];
  for (let tile of tiles) {
    if (!(tile.toString() in window.fftData)) {
      if (tile.toString() in window.iqData) {
        let samples = window.iqData[tile.toString()];
        const { newFftData, autoMax, autoMin, newCurrentFftMax, newCurrentFftMin } = calcFftOfTile(
          samples,
          fftSize,
          numFftsPerTile,
          windowFunction,
          magnitude_min,
          magnitude_max,
          autoscale,
          tempCurrentFftMax,
          tempCurrentFftMin
        );
        tempCurrentFftMax = newCurrentFftMax;
        tempCurrentFftMin = newCurrentFftMin;
        window.fftData[tile.toString()] = newFftData;
        autoMaxs.push(autoMax);
        autoMins.push(autoMin);
        //console.log('Finished processing tile', tile);
      } else {
        //console.log('Dont have iqData of tile', tile, 'yet');
      }
    }
  }

  // Concatenate the full tiles
  let totalFftData = new Uint8ClampedArray(tiles.length * fftSize * numFftsPerTile * 4); // 4 because RGBA
  let counter = 0; // can prob make this cleaner with an iterator in the for loop below
  for (let tile of tiles) {
    if (tile.toString() in window.fftData) {
      totalFftData.set(window.fftData[tile.toString()], counter);
    } else {
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
  const trimmedFftData = totalFftData.slice(lowerTrim * 4, totalFftData.length - upperTrim * 4); // totalFftData.length already includes the *4
  const num_final_ffts = trimmedFftData.length / fftSize / 4;
  //console.log('num_final_ffts:', num_final_ffts);

  // Render Image
  const imageData = new ImageData(trimmedFftData, fftSize, num_final_ffts);

  // Annotation portion
  let annotations_list = [];
  for (let i = 0; i < meta.annotations.length; i++) {
    let freq_lower_edge = meta.annotations[i]['core:freq_lower_edge'];
    let freq_upper_edge = meta.annotations[i]['core:freq_upper_edge'];
    let sample_start = meta.annotations[i]['core:sample_start'];
    let sample_count = meta.annotations[i]['core:sample_count'];
    let description = meta.annotations[i]['core:description'];

    // Calc the sample index of the first FFT being displayed
    let start_sample_index = lowerTile * TILE_SIZE_IN_IQ_SAMPLES;
    let samples_in_window = (upperTile - lowerTile) * TILE_SIZE_IN_IQ_SAMPLES;
    let stop_sample_index = start_sample_index + samples_in_window;
    let center_frequency = meta.captures[0]['core:frequency'];
    let sampleRate = meta.global['core:sample_rate'];
    window.sampleRate = sampleRate;
    let lower_freq = center_frequency - sampleRate / 2;
    if (
      (sample_start >= start_sample_index && sample_start < stop_sample_index) ||
      (sample_start + sample_count >= start_sample_index && sample_start < stop_sample_index)
    ) {
      annotations_list.push({
        x1: ((freq_lower_edge - lower_freq) / sampleRate) * fftSize, // left side. units are in fractions of an FFT size, e.g. 0-1024
        x2: ((freq_upper_edge - lower_freq) / sampleRate) * fftSize, // right side
        y1: (sample_start - start_sample_index) / fftSize, // top. NOTE SURE WHY I NEED THIS LAST TERM
        y2: (sample_start - start_sample_index + sample_count) / fftSize, // bottom. NOTE SURE WHY I NEED THIS LAST TERM
        description: description,
        index: i, // so we can keep track of which annotation it was in the full list
      });
    }
  }
  window.annotations = annotations_list;
  let selectFftReturn = {
    imageData: imageData,
    annotations: window.annotations,
    sampleRate: window.sampleRate,
    autoMax: autoMaxs.length ? average(autoMaxs) : 255,
    autoMin: autoMins.length ? average(autoMins) : 0,
    currentFftMax: tempCurrentFftMax,
    currentFftMin: tempCurrentFftMin,
  };
  return selectFftReturn;
};

export function calculateTileNumbers(handleTop: any, totalIQSamples: any, fftSize: any, spectrogramHeight: any) {
  const fftsOnScreen = spectrogramHeight; // remember, we are assuming that 1 row of pixels = 1 FFT
  const fftsPerTile = TILE_SIZE_IN_IQ_SAMPLES / fftSize;
  const fractionIntoFile = handleTop / spectrogramHeight; // because of the way the scrollbar works and is always same height as spectrogram

  // Find which tiles are within view (in units of tiles incl fraction)
  const lowerTile = (totalIQSamples * fractionIntoFile) / TILE_SIZE_IN_IQ_SAMPLES;
  const upperTile = fftsOnScreen / fftsPerTile + lowerTile;

  //console.log('lowerTile:', lowerTile, 'upperTile:', upperTile);
  return { lowerTile: lowerTile, upperTile: upperTile };
}

// mimicing python's range() function which gives array of integers between two values non-inclusive of end
export function range(start: any, end: any) {
  return Array.apply(0, Array(end - start)).map((element, index) => index + start);
}

export function dataTypeToBytesPerSample(dataType: any) {
  let bytesPerSample = null;
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
