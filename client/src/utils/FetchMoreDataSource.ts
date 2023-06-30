// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { INITIAL_PYTHON_SNIPPET } from '@/utils/constants';

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

function callPyodide(pyodide, pythonSnippet, samples) {
  console.debug('Running Python Snippet');

  // if for some reason it's still not initialized, return samples without modification
  if (!pyodide) {
    console.debug('Pyodide isnt initialized yet');
    return samples;
  }

  // make samples available within python
  //    trick from https://github.com/pyodide/pyodide/blob/main/docs/usage/faq.md#how-can-i-execute-code-in-a-custom-namespace
  let myNamespace = pyodide.toPy({ x: Array.from(samples) });

  // Add the conversion code to the snippet
  pythonSnippet = 'import numpy as np\nx = np.asarray(x)\n' + pythonSnippet + '\nx = x.tolist()';

  // TODO: print python errors to console somehow, look at https://pyodide.org/en/stable/usage/api/python-api/code.html#pyodide.code.eval_code
  pyodide.runPython(pythonSnippet, { globals: myNamespace });

  samples = myNamespace.toJs().get('x'); // pull out python variable x

  return samples;
}

export function applyProcessing(samples, taps, pythonSnippet, pyodide) {
  if (taps && taps.length !== 1) {
    samples = convolve(samples, taps); // we apply the taps here and not in the FFT calcs so transients dont hurt us as much
  }
  if (pyodide && pythonSnippet && pythonSnippet.length > 0 && pythonSnippet != INITIAL_PYTHON_SNIPPET) {
    samples = callPyodide(pyodide, pythonSnippet, samples);
  }
  return samples;
}

export function convertToFloat32(buffer, dataType) {
  if (dataType === 'ci8_le' || dataType === 'ci8' || dataType === 'i8') {
    let samples = Float32Array.from(new Int8Array(buffer));
    for (let i = 0; i < samples.length; i++) samples[i] = samples[i] / 255.0;
    return samples;
  } else if (dataType === 'cu8_le' || dataType === 'cu8' || dataType === 'u8') {
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
    //return new Float32Array(buffer);
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
