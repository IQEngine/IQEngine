// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { fftshift } from 'fftshift';
import { colMap } from './colormap';
import { TILE_SIZE_IN_BYTES } from '../Utils/constants';

const FFT = require('fft.js');

window.fft_data = {}; // this is where our FFT outputs are stored
window.annotations = []; // gets filled in before return
window.sample_rate = 1; // will get filled in

// This will get called when we go to a new spectrogram page
export const clear_all_data = () => {
  window.fft_data = {}; // this is where our FFT outputs are stored
  window.annotations = []; // gets filled in before return
  window.sample_rate = 1; // will get filled in
  window.iq_data = {}; // initialized in blobSlice.js but we have to clear it each time we go to another spectrogram page
};

function getStandardDeviation(array) {
  const n = array.length;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
}

const average = (array) => array.reduce((a, b) => a + b) / array.length;

function calcFftOfTile(
  samples,
  fft_size,
  num_ffts,
  windowFunction,
  magnitude_min,
  magnitude_max,
  autoscale,
  currentFftMax,
  currentFftMin
) {
  let startTime = performance.now();
  const clearBuf = new ArrayBuffer(fft_size * num_ffts * 4); // fills with 0s ie. rgba 0,0,0,0 = transparent
  let new_fft_data = new Uint8ClampedArray(clearBuf);
  let startOfs = 0;
  let autoMin = 0;
  let autoMax = 0;
  let tempCurrentFftMax = currentFftMax;
  let tempCurrentFftMin = currentFftMin;

  // loop through each row
  for (let i = 0; i < num_ffts; i++) {
    let samples_slice = samples.slice(i * fft_size * 2, (i + 1) * fft_size * 2); // mult by 2 because this is int/floats not IQ samples

    // Apply a hamming window and hanning window
    if (windowFunction === 'hamming') {
      for (let window_i = 0; window_i < fft_size; window_i++) {
        samples_slice[window_i] =
          samples_slice[window_i] * (0.54 - 0.46 * Math.cos((2 * Math.PI * window_i) / (fft_size - 1)));
      }
    } else if (windowFunction === 'hanning') {
      for (let window_i = 0; window_i < fft_size; window_i++) {
        samples_slice[window_i] =
          samples_slice[window_i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * window_i) / (fft_size - 1)));
      }
    } else if (windowFunction === 'bartlett') {
      for (let window_i = 0; window_i < fft_size; window_i++) {
        samples_slice[window_i] =
          samples_slice[window_i] *
          ((2 / (fft_size - 1)) * ((fft_size - 1) / 2) - Math.abs(window_i - (fft_size - 1) / 2));
      }
    } else if (windowFunction === 'blackman') {
      for (let window_i = 0; window_i < fft_size; window_i++) {
        samples_slice[window_i] =
          samples_slice[window_i] *
          (0.42 -
            0.5 * Math.cos((2 * Math.PI * window_i) / fft_size) +
            0.08 * Math.cos((4 * Math.PI * window_i) / fft_size));
      }
    }

    const f = new FFT(fft_size);
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
    magnitudes = magnitudes.map((x) => x / tempCurrentFftMax); // highest value is now 1
    magnitudes = magnitudes.map((x) => x * 255); // now from 0 to 255

    // When you click the button this code will run once, then it will turn itself off until you click it again
    if (autoscale) {
      // get the last calculated standard deviation and mean calculated from this loop and define the auto magnitude of min and max
      const std = getStandardDeviation(magnitudes);
      const mean = magnitudes.reduce((a, b) => a + b) / magnitudes.length;
      // for now we're just going to use whatever the last FFT row's value is for min/max
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
    let line_offset = i * fft_size * 4;
    for (let sigVal, rgba, opIdx = 0, ipIdx = startOfs; ipIdx < fft_size + startOfs; opIdx += 4, ipIdx++) {
      sigVal = ipBuf8[ipIdx] || 0; // if input line too short add zeros
      rgba = colMap[sigVal]; // array of rgba values
      // byte reverse so number aa bb gg rr
      new_fft_data[line_offset + opIdx] = rgba[0]; // red
      new_fft_data[line_offset + opIdx + 1] = rgba[1]; // green
      new_fft_data[line_offset + opIdx + 2] = rgba[2]; // blue
      new_fft_data[line_offset + opIdx + 3] = rgba[3]; // alpha
    }
  }
  let endTime = performance.now();
  console.log('Rendering spectrogram took', endTime - startTime, 'milliseconds'); // first cut of our code processed+rendered 0.5M samples in 760ms on marcs computer
  return {
    new_fft_data: new_fft_data,
    autoMax: autoMax,
    autoMin: autoMin,
    newCurrentFftMax: tempCurrentFftMax,
    newCurrentFftMin: tempCurrentFftMin,
  };
}

// lowerTile and upperTile are in fractions of a tile
export const select_fft = (
  lowerTile,
  upperTile,
  bytes_per_sample,
  fftSize,
  magnitudeMax,
  magnitudeMin,
  meta,
  windowFunction,
  currentFftMax,
  currentFftMin,
  autoscale = false
) => {
  let fft_size = fftSize;
  const num_ffts = TILE_SIZE_IN_BYTES / bytes_per_sample / 2 / fftSize; // per tile
  let magnitude_max = magnitudeMax;
  let magnitude_min = magnitudeMin;
  let tempCurrentFftMax = currentFftMax;
  let tempCurrentFftMin = currentFftMin;

  // Go through each of the tiles and compute the FFT and save in window.fft_data
  const tiles = range(Math.floor(lowerTile), Math.ceil(upperTile));
  let autoMaxs = [];
  let autoMins = [];
  for (let tile of tiles) {
    if (!(tile.toString() in window.fft_data)) {
      if (tile.toString() in window.iq_data) {
        let samples = window.iq_data[tile.toString()];
        const { new_fft_data, autoMax, autoMin, newCurrentFftMax, newCurrentFftMin } = calcFftOfTile(
          samples,
          fft_size,
          num_ffts,
          windowFunction,
          magnitude_min,
          magnitude_max,
          autoscale,
          tempCurrentFftMax,
          tempCurrentFftMin
        );
        tempCurrentFftMax = newCurrentFftMax;
        tempCurrentFftMin = newCurrentFftMin;
        window.fft_data[tile.toString()] = new_fft_data;
        autoMaxs.push(autoMax);
        autoMins.push(autoMin);
        //console.log('Finished processing tile', tile);
      } else {
        //console.log('Dont have iq_data of tile', tile, 'yet');
      }
    }
  }

  // Concatenate the full tiles
  let total_fft_data = new Uint8ClampedArray(tiles.length * fft_size * num_ffts * 4);
  let counter = 0; // can prob make this cleaner with an iterator in the for loop below
  for (let tile of tiles) {
    if (tile.toString() in window.fft_data) {
      total_fft_data.set(window.fft_data[tile.toString()], counter);
      counter = counter + window.fft_data[tile.toString()].length;
    } else {
      // If the first slice isnt availabel fill with ones
      let fake_fft_data = new Uint8ClampedArray(fft_size * num_ffts * 4);
      fake_fft_data.fill(255); // for debugging its better to have the alpha set to opaque so the missing part isnt invisible
      total_fft_data.set(fake_fft_data, counter);
      counter = counter + fake_fft_data.length;
    }
  }

  // Trim off the top and bottom
  let lowerTrim = (lowerTile - Math.floor(lowerTile)) * fft_size * num_ffts; // amount we want to get rid of
  lowerTrim = lowerTrim - (lowerTrim % fft_size);
  let upperTrim = (1 - (upperTile - Math.floor(upperTile))) * fft_size * num_ffts; // amount we want to get rid of
  upperTrim = upperTrim - (upperTrim % fft_size);
  const trimmed_fft_data = total_fft_data.slice(lowerTrim * 4, total_fft_data.length - upperTrim * 4);
  const num_final_ffts = trimmed_fft_data.length / fft_size / 4;

  // Render Image
  const image_data = new ImageData(trimmed_fft_data, fft_size, num_final_ffts);

  // Annotation portion
  let annotations_list = [];
  for (let i = 0; i < meta.annotations.length; i++) {
    let freq_lower_edge = meta.annotations[i]['core:freq_lower_edge'];
    let freq_upper_edge = meta.annotations[i]['core:freq_upper_edge'];
    let sample_start = meta.annotations[i]['core:sample_start'];
    let sample_count = meta.annotations[i]['core:sample_count'];
    let description = meta.annotations[i]['core:description'];

    // Calc the sample index of the first FFT being displayed
    let start_sample_index = (lowerTile * TILE_SIZE_IN_BYTES) / 2 / bytes_per_sample;
    let samples_in_window = ((upperTile - lowerTile) * TILE_SIZE_IN_BYTES) / 2 / bytes_per_sample;
    let stop_sample_index = start_sample_index + samples_in_window;
    let center_frequency = meta.captures[0]['core:frequency'];
    let sample_rate = meta.global['core:sample_rate'];
    window.sample_rate = sample_rate;
    let lower_freq = center_frequency - sample_rate / 2;

    if (
      (sample_start >= start_sample_index && sample_start < stop_sample_index) ||
      (sample_start + sample_count >= start_sample_index && sample_start + sample_count < stop_sample_index)
    ) {
      annotations_list.push({
        x1: ((freq_lower_edge - lower_freq) / sample_rate) * fft_size, // left side. units are in fractions of an FFT size, e.g. 0-1024
        x2: ((freq_upper_edge - lower_freq) / sample_rate) * fft_size, // right side
        y1: ((sample_start - start_sample_index) / fft_size) * 0.92, // top FIXME WHY DO WE NEED THIS SCALAR FOR IT TO WORK
        y2: ((sample_start - start_sample_index + sample_count) / fft_size) * 0.92, // bottom FIXME WHY DO WE NEED THIS SCALAR FOR IT TO WORK
        description: description,
      });
    }
  }
  window.annotations = annotations_list;
  let select_fft_return = {
    image_data: image_data,
    annotations: window.annotations,
    sample_rate: window.sample_rate,
    autoMax: autoMaxs.length ? average(autoMaxs) : 255,
    autoMin: autoMins.length ? average(autoMins) : 0,
    currentFftMax: tempCurrentFftMax,
    currentFftMin: tempCurrentFftMin,
  };
  return select_fft_return;
};

export function calculateTileNumbers(handleTop, bytesPerSample, blob, fftSize) {
  const { totalBytes } = blob;
  const tileSizeInRows = TILE_SIZE_IN_BYTES / bytesPerSample / 2 / fftSize;
  const totalNumFFTs = totalBytes / bytesPerSample / 2 / fftSize; // divide by 2 because IQ
  const scrollBarHeight = 600; // TODO REPLACE ME WITH ACTUAL WINDOW HEIGHT
  const handleFraction = scrollBarHeight / totalNumFFTs;
  const handleHeightPixels = handleFraction * scrollBarHeight;

  // Find which tiles are within view
  const lowerTile = (totalNumFFTs / tileSizeInRows) * (handleTop / scrollBarHeight);
  let upperTile = (totalNumFFTs / tileSizeInRows) * ((handleTop + handleHeightPixels) / scrollBarHeight);

  // Make sure we dont try to fetch more than exists in the file
  if (Math.ceil(upperTile) * tileSizeInRows > totalNumFFTs) {
    upperTile = Math.floor(upperTile) - 1 + 0.9999; // show the whole tile but dont go to the next one, which would go past the end of the file
  }

  return { lowerTile: lowerTile, upperTile: upperTile };
}

// mimicing python's range() function which gives array of integers between two values non-inclusive of end

export function range(start, end) {
  return Array.apply(0, Array(end - start + 1)).map((element, index) => index + start);
}
