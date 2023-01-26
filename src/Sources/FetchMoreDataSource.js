// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { createAsyncThunk } from '@reduxjs/toolkit';

export function convolve(array, taps) {
  // make sure its an odd number of taps
  if (taps.length % 2 !== 1) taps.push(0);

  let I = array.filter((element, index) => {
    return index % 2 === 0;
  });
  let Q = array.filter((element, index) => {
    return index % 2 === 1;
  });

  let offset = ~~(taps.length / 2);
  let output = new Float32Array(array.length);
  for (let i = 0; i < array.length / 2; i++) {
    let kmin = i >= offset ? 0 : offset - i;
    let kmax = i + offset < array.length / 2 ? taps.length - 1 : array.length / 2 - 1 - i + offset;
    output[i * 2] = 0; // I
    output[i * 2 + 1] = 0; // Q
    for (let k = kmin; k <= kmax; k++) {
      output[i * 2] += I[i - offset + k] * taps[k]; // I
      output[i * 2 + 1] += Q[i - offset + k] * taps[k]; // Q
    }
  }
  return output;
}

export function applyConvolve(buffer, taps, data_type) {
  let samples;
  if (data_type === 'ci16_le') {
    samples = new Int16Array(buffer);
    samples = convolve(samples, taps); // we apply the taps here and not in the FFT calcs so transients dont hurt us as much
    samples = Int16Array.from(samples); // convert back to int TODO: clean this up
  } else if (data_type === 'cf32_le') {
    samples = new Float32Array(buffer);
    samples = convolve(samples, taps);
  } else {
    console.error('unsupported data_type');
    samples = new Int16Array(buffer);
  }
  return samples;
}

export function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

const FetchMoreData = createAsyncThunk('FetchMoreData', async (args, thunkAPI) => {
  console.log('running FetchMoreData');
  const { tile, connection, blob, data_type, offset, count } = args;

  let samples;
  let startTime = performance.now();
  if (connection.datafilehandle === null) {
    let { recording, blobClient } = connection;
    while (recording === '') {
      console.log('waiting'); // hopefully this doesn't happen, and if it does it should be pretty quick because its the time it takes for the state to set
    }
    //console.log('offset:', offset, 'count:', count);
    const downloadBlockBlobResponse = await blobClient.download(offset, count);
    const blobResp = await downloadBlockBlobResponse.blobBody; // this is how you have to do it in browser, in backend you can use readableStreamBody
    const buffer = await blobResp.arrayBuffer();

    samples = applyConvolve(buffer, blob.taps, data_type);
  } else {
    // Use a local file
    let handle = connection.datafilehandle;
    const fileData = await handle.getFile();
    console.log('offset:', offset, 'count:', count);
    const buffer = await readFileAsync(fileData.slice(offset, offset + count));
    samples = applyConvolve(buffer, blob.taps, data_type);
  }

  console.log('Fetching more data took', performance.now() - startTime, 'milliseconds');
  return { tile: tile, samples: samples, data_type: data_type }; // these represent the new samples
});

export default FetchMoreData;
