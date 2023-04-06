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

async function callPyodide(pyodide, pythonSnippet, samples) {
  console.log('Running Python Snippet');

  // if for some reason it's still not initialized, return samples without modification
  if (!pyodide) {
    console.log('Pyodide isnt initialized yet');
    return samples;
  }

  // make samples available within python
  //    trick from https://github.com/pyodide/pyodide/blob/main/docs/usage/faq.md#how-can-i-execute-code-in-a-custom-namespace
  let my_namespace = pyodide.toPy({ x: Array.from(samples) });

  // Add the conversion code to the snippet
  pythonSnippet = 'import numpy as np\nx = np.asarray(x)\n' + pythonSnippet + '\nx = x.tolist()';

  // TODO: print python errors to console somehow, look at https://pyodide.org/en/stable/usage/api/python-api/code.html#pyodide.code.eval_code
  await pyodide.runPythonAsync(pythonSnippet, { globals: my_namespace });

  samples = my_namespace.toJs().get('x'); // pull out python variable x

  return samples;
}

export async function applyProcessing(buffer, taps, pythonSnippet, pyodide, data_type) {
  let samples;
  if (data_type === 'ci16_le') {
    samples = new Int16Array(buffer);
    if (taps.length !== 1) {
      samples = convolve(samples, taps); // we apply the taps here and not in the FFT calcs so transients dont hurt us as much
    }
    if (pythonSnippet !== '') {
      samples = await callPyodide(pyodide, pythonSnippet, samples);
    }
    samples = Int16Array.from(samples); // convert back to int TODO: clean this up
  } else if (data_type === 'cf32_le') {
    samples = new Float32Array(buffer);
    if (taps.length !== 1) {
      samples = convolve(samples, taps);
    }
    if (pythonSnippet !== '') {
      samples = await callPyodide(pyodide, pythonSnippet, samples);
    }
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

/*
async function fetchUsingPythonSnippet(offset, count, blobName, dataType) {
  const resp = await fetch('https://iqengine-azure-functions2.azurewebsites.net/pythonsnippet', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dataType: dataType,
      offset: offset,
      count: count,
      blobName: blobName,
    }),
  });
  return resp.arrayBuffer(); // not typed- we convert it to the right type later
}
*/

const FetchMoreData = createAsyncThunk('FetchMoreData', async (args, thunkAPI) => {
  console.log('running FetchMoreData');
  const { tile, connection, blob, data_type, offset, count, pyodide } = args;

  let samples;
  let startTime = performance.now();
  if (connection.datafilehandle === null) {
    let { recording, blobClient } = connection;
    while (recording === '') {
      console.log('waiting'); // hopefully this doesn't happen, and if it does it should be pretty quick because its the time it takes for the state to set
    }

    let buffer;
    /*
    if (pythonSnippet !== '') {
      // About 900 ms
      const blobName = recording.replaceAll('(slash)', '/') + '.sigmf-data';
      buffer = await fetchUsingPythonSnippet(offset, count, blobName, data_type, pythonSnippet);
    } else {
      */
    // 600 ms for straight from blob
    const downloadBlockBlobResponse = await blobClient.download(offset, count);
    const blobResp = await downloadBlockBlobResponse.blobBody; // this is how you have to do it in browser, in backend you can use readableStreamBody
    buffer = await blobResp.arrayBuffer();
    //}

    samples = await applyProcessing(buffer, blob.taps, blob.pythonSnippet, pyodide, data_type);
  } else {
    // Use a local file
    let handle = connection.datafilehandle;
    const fileData = await handle.getFile();
    console.log('offset:', offset, 'count:', count);
    const buffer = await readFileAsync(fileData.slice(offset, offset + count));
    samples = await applyProcessing(buffer, blob.taps, blob.pythonSnippet, pyodide, data_type);
  }

  console.log('Fetching more data took', performance.now() - startTime, 'milliseconds');
  return { tile: tile, samples: samples, data_type: data_type }; // these represent the new samples
});

export default FetchMoreData;
