// Adapted from https://github.com/j-funk/js-dsp-test
// Nice comparison in https://thebreakfastpost.com/2015/10/18/ffts-in-javascript/

var num_trials = 1000;
var fftSize = 1024; //16384;
const seed = 'this is a seed for rng!';

function genInputReal32(size) {
  let prng = isaacCSPRNG(seed);
  var result_r = new Float32Array(size);
  var result_i = new Float32Array(size);
  for (var i = 0; i < size; i++) {
    result_r[i] = prng.random() / 2.0; // -0.5 to 0.5 uniformly distributed
    result_i[i] = prng.random() / 2.0;
  }
  return [result_r, result_i];
}

// interleaved complex (produces 2x the output as genInputReal32 for a given size)
function genInputComplex32(size) {
  let prng = isaacCSPRNG(seed);
  var result = new Float32Array(2 * size);
  for (var i = 0; i < size; i++) {
    result[2 * i] = prng.random() / 2.0;
    result[2 * i + 1] = prng.random() / 2.0;
  }
  return result;
}

function genInputReal64(size) {
  let prng = isaacCSPRNG(seed);
  var result_r = new Float64Array(size);
  var result_i = new Float64Array(size);
  for (var i = 0; i < size; i++) {
    result_r[i] = prng.random() / 2.0; // -0.5 to 0.5 uniformly distributed
    result_i[i] = prng.random() / 2.0;
  }
  return [result_r, result_i];
}

function genComplexArryType(size) {
  let prng = isaacCSPRNG(seed);
  var result = new complex_array.ComplexArray(size);
  for (var i = 0; i < size; i++) {
    result.real[i] = prng.random() / 2.0;
    result.imag[i] = prng.random() / 2.0;
  }
  return result;
}

//===============
// Start of FFTs
//===============

// pure javascript, double precision, in-place, feeding it single seems to work fine
function nayukiJavascript(size) {
  const [re, im] = genInputReal32(size);
  let real = new Float32Array(size); // will store input and output each call
  let imag = new Float32Array(size);

  // Warmup
  for (var i = 0; i < num_trials; ++i) {
    real.set(re);
    imag.set(im);
    transform(real, imag);
  }

  var start = performance.now();
  var total = 0.0;
  for (var i = 0; i < num_trials; ++i) {
    real.set(re);
    imag.set(im);
    transform(real, imag); // this does the FFT
    for (var j = 0; j < size; ++j) {
      total += Math.sqrt(real[j] * real[j] + imag[j] * imag[j]);
    }
  }
  var end = performance.now();
  return [end - start, total];
}

// pure javascript but with sin/cos tables precomputed, double precision, in-place, feeding it single seems to work fine
function nayuki2Javascript(size) {
  var fft = new FFTNayuki(size);
  let [re, im] = genInputReal32(size);
  let real = new Float32Array(size); // will store input and output each call
  let imag = new Float32Array(size);

  // Warmup
  for (var i = 0; i < num_trials; ++i) {
    real.set(re);
    imag.set(im);
    fft.forward(real, imag);
  }

  var start = performance.now();
  var total = 0.0;
  for (var i = 0; i < num_trials; ++i) {
    real.set(re);
    imag.set(im);
    fft.forward(real, imag);
    for (var j = 0; j < size; ++j) {
      total += Math.sqrt(real[j] * real[j] + imag[j] * imag[j]);
    }
  }
  var end = performance.now();
  return [end - start, total];
}

// wasm with sin/cos tables precomputed, SINGLE precision, in-place
function nayuki3Wasm(size) {
  var fft = new FFTNayukiC(size);
  let [re, im] = genInputReal32(size);
  let real = new Float32Array(size); // will store input and output each call
  let imag = new Float32Array(size);

  // Warmup
  for (var i = 0; i < num_trials; ++i) {
    real.set(re);
    imag.set(im);
    fft.forward(real, imag);
  }

  var start = performance.now();
  total = 0.0;
  for (var i = 0; i < num_trials; ++i) {
    real.set(re);
    imag.set(im);
    fft.forward(real, imag);
    for (var j = 0; j < size; ++j) {
      total += Math.sqrt(real[j] * real[j] + imag[j] * imag[j]);
    }
  }
  var end = performance.now();
  fft.dispose();
  return [end - start, total];
}

// fft.js by Jens Nockert (nockert), pure javascript, double precision but feeding it single seems to work fine
function nockertJavascript(size) {
  var fft = new FFT.complex(size, false); // 2nd arg is for inverse
  var ci = genInputComplex32(size);
  var co = new Float32Array(2 * size); // output buffer

  for (var i = 0; i < num_trials; ++i) fft.simple(co, ci, 'complex'); // Warmup

  var start = performance.now();
  total = 0.0;
  for (var i = 0; i < num_trials; ++i) {
    fft.simple(co, ci, 'complex'); // out, in, complex/real
    for (var j = 0; j < size; ++j) {
      total += Math.sqrt(co[j * 2] * co[j * 2] + co[j * 2 + 1] * co[j * 2 + 1]);
    }
  }
  var end = performance.now();
  return [end - start, total];
}

// another fft.js (one used in iqengine) by indutny, pure javascript
function indutnyJavascript(size) {
  var fft = new FFT_indutny(size);
  var ci = genInputComplex32(size);
  var co = new Float32Array(2 * size); // output buffer

  for (var i = 0; i < num_trials; ++i) fft.transform(co, ci); // Warmup

  var start = performance.now();
  total = 0.0;
  for (var i = 0; i < num_trials; ++i) {
    fft.transform(co, ci);
    for (var j = 0; j < size; ++j) {
      total += Math.sqrt(co[j * 2] * co[j * 2] + co[j * 2 + 1] * co[j * 2 + 1]);
    }
  }
  var end = performance.now();
  return [end - start, total];
}

// jsfft by Nick Jones (dntj), javascript, single precision
function dntjJavascript(size) {
  var ci = genComplexArryType(size);

  for (var i = 0; i < num_trials; ++i) ci.FFT(); // Warmup

  var start = performance.now();
  var scale = Math.sqrt(size) / 1.5;
  total = 0.0;
  for (var i = 0; i < num_trials; ++i) {
    var co = ci.FFT();
    for (var j = 0; j < size; ++j) {
      total += scale * Math.sqrt(co.real[j] * co.real[j] + co.imag[j] * co.imag[j]);
    }
  }
  var end = performance.now();
  return [end - start, total];
}

// wasm, double precision
function crossWasm(size) {
  var fft = new FFTCross(size);
  const [real, imag] = genInputReal64(size);

  for (var i = 0; i < num_trials; ++i) fft.transform(real, imag, false); // Warmup

  var start = performance.now();
  total = 0.0;
  for (var i = 0; i < num_trials; ++i) {
    var out = fft.transform(real, imag, false); // last arg is inverse
    for (var j = 0; j < size; ++j) {
      total += Math.sqrt(out.real[j] * out.real[j] + out.imag[j] * out.imag[j]);
    }
  }
  var end = performance.now();
  fft.dispose();
  return [end - start, total];
}

// wasm, single precision.  was at 7400 before marcs tweaks
function kissWasm(size) {
  var fft = new KissFFT(size);
  var cin = genInputComplex32(size);

  for (var i = 0; i < num_trials; ++i) fft.forward(cin); // Warmup

  var start = performance.now();
  total = 0.0;
  for (var i = 0; i < num_trials; ++i) {
    var out = fft.forward(cin);
    for (var j = 0; j < size; ++j) {
      total += Math.sqrt(out[j * 2] * out[j * 2] + out[j * 2 + 1] * out[j * 2 + 1]); // sum the magnitudes as a way to check if the result looks correct
    }
  }
  var end = performance.now();
  fft.dispose();
  return [end - start, total];
}

var tests = [
  nayukiJavascript,
  nayuki2Javascript,
  nayuki3Wasm,
  kissWasm,
  crossWasm,
  nockertJavascript,
  dntjJavascript,
  indutnyJavascript,
];

window.onload = function () {
  let test_names = [];
  let results = [];
  let totals = [];
  let barColors = [];
  for (let i = 0; i < tests.length; i++) {
    console.log('Starting', tests[i].name);
    const [elapsed, total] = tests[i](fftSize);
    const ffts_per_second = 1000.0 / (elapsed / num_trials);
    if (tests[i].name.includes('Javascript')) {
      test_names.push(tests[i].name.split('Javascript')[0]);
      barColors.push('rgba(255,0,0,0.7)');
    } else {
      test_names.push(tests[i].name.split('Wasm')[0]);
      barColors.push('rgba(0,0,255,0.7)');
    }
    results.push(ffts_per_second);
    totals.push(total);
  }

  // Plotly stuff
  const xArray = test_names;
  const yArray = results;

  const data = [
    {
      x: xArray,
      y: yArray,
      type: 'bar',
      marker: { color: barColors },
    },
  ];

  const layout = {
    title: 'Comparison of FFTs in Javascript and WebAssembly',
    yaxis: {
      title: {
        text: 'FFTs per Second',
        font: {
          family: 'sans serif',
          size: 18,
        },
      },
    },
    annotations: [
      {
        x: 1,
        y: Math.max.apply(Math, yArray) * 1.2,
        text: 'JavaScript',
        showarrow: false,
        font: {
          family: 'sans serif',
          size: 18,
          color: 'rgba(255,0,0,1)',
        },
      },
      {
        x: 1,
        y: Math.max.apply(Math, yArray) * 1.3,
        text: 'WebAssembly',
        showarrow: false,
        font: {
          family: 'sans serif',
          size: 18,
          color: 'rgba(0,0,255,1)',
        },
      },
    ],
  };

  Plotly.newPlot('myPlot', data, layout);
};
