// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { createAsyncThunk } from '@reduxjs/toolkit';
import { dataTypeToBytesPerSample } from '../Utils/selector';

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

async function callPyodide(pyodide, pythonSnippet, samples) {
  console.log('Running Python Snippet');

  // if for some reason it's still not initialized, return samples without modification
  if (!pyodide) {
    console.log('Pyodide isnt initialized yet');
    return samples;
  }

  // make samples available within python
  //    trick from https://github.com/pyodide/pyodide/blob/main/docs/usage/faq.md#how-can-i-execute-code-in-a-custom-namespace
  let myNamespace = pyodide.toPy({ x: Array.from(samples) });

  // Add the conversion code to the snippet
  pythonSnippet = 'import numpy as np\nx = np.asarray(x)\n' + pythonSnippet + '\nx = x.tolist()';

  // TODO: print python errors to console somehow, look at https://pyodide.org/en/stable/usage/api/python-api/code.html#pyodide.code.eval_code
  await pyodide.runPythonAsync(pythonSnippet, { globals: myNamespace });

  samples = myNamespace.toJs().get('x'); // pull out python variable x

  return samples;
}

export async function applyProcessing(samples, taps, pythonSnippet, pyodide) {
  if (taps.length !== 1) {
    samples = convolve(samples, taps); // we apply the taps here and not in the FFT calcs so transients dont hurt us as much
  }
  if (pythonSnippet !== '') {
    samples = await callPyodide(pyodide, pythonSnippet, samples);
  }
  return samples;
}

export function convertToFloat32(buffer, dataType) {
  if (dataType === 'ci8_le') {
    let samples = Float32Array.from(new Int8Array(buffer));
    for (let i = 0; i < samples.length; i++) samples[i] = samples[i] / 255.0;
    return samples;
  } else if (dataType === 'cu8_le') {
    let samples = Float32Array.from(new Uint8Array(buffer));
    for (let i = 0; i < samples.length; i++) samples[i] = (samples[i] - 255.0) / 255.0;
    return samples;
  } else if (dataType === 'ci16_le') {
    let samples = Float32Array.from(new Int16Array(buffer));
    for (let i = 0; i < samples.length; i++) samples[i] = samples[i] / 32768.0;
    return samples;
  } else if (dataType === 'cu16_le') {
    let samples = Float32Array.from(new Uint16Array(buffer));
    for (let i = 0; i < samples.length; i++) samples[i] = (samples[i] - 32768.0) / 32768.0;
    return samples;
  } else if (dataType === 'ci32_le') {
    let samples = Float32Array.from(new Int32Array(buffer));
    for (let i = 0; i < samples.length; i++) samples[i] = samples[i] / 2147483647.0;
    return samples;
  } else if (dataType === 'cu32_le') {
    let samples = Float32Array.from(new Uint32Array(buffer));
    for (let i = 0; i < samples.length; i++) samples[i] = (samples[i] - 2147483647.0) / 2147483647.0;
    return samples;
  } else if (dataType === 'cf32_le') {
    return new Float32Array(buffer);
  } else if (dataType === 'cf64_le') {
    return Float32Array.from(new Float64Array(buffer));
  } else {
    console.error('unsupported dataType');
    return new Int16Array(buffer);
  }
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
  const { tile, connection, blob, dataType, offset, count, pyodide } = args;

  // offset and count are in IQ samples, convert to bytes
  const bytesPerSample = dataTypeToBytesPerSample(dataType);
  const offsetBytes = offset * bytesPerSample * 2; // FIXME at some point we need to specify whether real or complex
  const countBytes = count * bytesPerSample * 2;

  let samples;
  let buffer;
  let startTime = performance.now();
  // tells us we're using blob storage
  if (connection.datafilehandle === null) {
    let { recording, blobClient } = connection;
    while (recording === '') {
      console.log('waiting'); // hopefully this doesn't happen, and if it does it should be pretty quick because its the time it takes for the state to set
    }
    const downloadBlockBlobResponse = await blobClient.download(offsetBytes, countBytes);
    const blobResp = await downloadBlockBlobResponse.blobBody; // this is how you have to do it in browser, in backend you can use readableStreamBody
    buffer = await blobResp.arrayBuffer();
  } else {
    // Use a local file
    let handle = connection.datafilehandle;
    const fileData = await handle.getFile();
    buffer = await readFileAsync(fileData.slice(offsetBytes, offsetBytes + countBytes));
  }
  samples = convertToFloat32(buffer, dataType); // samples are kept as float32 under the hood for simplicity
  samples = await applyProcessing(samples, blob.taps, blob.pythonSnippet, pyodide);

  console.log('FetchMoreData() took', performance.now() - startTime, 'ms');
  return { tile: tile, samples: samples, dataType: dataType }; // these represent the new samples
});

export default FetchMoreData;
