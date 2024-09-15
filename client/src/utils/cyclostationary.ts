// import fft
import { FFT } from './fft.js';
import { fftshift } from 'fftshift';

/*
function fftshift(src) {
  return rotate(src, Math.floor(src.length / 2));
}
*/

function arrayRotate(arr, count) {
  const len = arr.length;
  arr.push(...arr.splice(0, ((-count % len) + len) % len));
  return arr;
}

// SCF with time smoothing method (lots of FFTs)
export function calc_SCF_time_smoothing(samples, alphas, Nw) {
  const N = samples.length / 2;

  // SCF
  const num_windows = Math.floor(N / Nw); // Number of windows

  //const window = new Array(Nw);
  //for (let i = 0; i < Nw; i++) {
  //  window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (Nw - 1)));
  //}

  // outter array is for each alpha, inner array is for each window
  const SCF = Array.from({ length: alphas.length }, () => new Array(Nw * 2).fill(0)); // need it to start at 0

  // Prep
  const neg = new Array(N * 2);
  const pos = new Array(N * 2);

  const fft_obj_pos = new FFT(Nw);
  const fft_obj_neg = new FFT(Nw);
  const neg_out = fft_obj_neg.createComplexArray();
  const pos_out = fft_obj_pos.createComplexArray();

  // loop through cyclic freq (alphas)
  for (let alpha_idx = 0; alpha_idx < alphas.length; alpha_idx++) {
    const alpha_times_pi = alphas[alpha_idx] * Math.PI;

    for (let i = 0; i < N; i++) {
      // below has been heavily optimized, see python for simpler version of whats going on
      const cos_term = Math.cos(alpha_times_pi * i);
      const sin_term = Math.sin(alpha_times_pi * i);
      const a = samples[2 * i] * cos_term;
      const b = samples[2 * i + 1] * sin_term;
      const c = samples[2 * i + 1] * cos_term;
      const d = samples[2 * i] * sin_term;
      neg[2 * i] = a + b;
      neg[2 * i + 1] = c - d;
      pos[2 * i] = a - b;
      pos[2 * i + 1] = d + c;
    }

    // Cross Cyclic Power Spectrum
    for (let i = 0; i < num_windows; i++) {
      const pos_slice = pos.slice(2 * i * Nw, 2 * i * Nw + 2 * Nw); // 2* because of how we store complex
      const neg_slice = neg.slice(2 * i * Nw, 2 * i * Nw + 2 * Nw);

      // Apply window
      //pos_slice = pos_slice.map((val, idx) => val * window[idx]);
      //neg_slice = neg_slice.map((val, idx) => val * window[idx]);

      // Take FFTs
      fft_obj_neg.transform(neg_out, neg_slice);
      fft_obj_pos.transform(pos_out, pos_slice);

      // Multiply neg_fft with complex conjugate of pos_fft
      for (let j = 0; j < Nw; j++) {
        SCF[alpha_idx][2 * j] += neg_out[2 * j] * pos_out[2 * j] + neg_out[2 * j + 1] * pos_out[2 * j + 1];
        SCF[alpha_idx][2 * j + 1] += neg_out[2 * j + 1] * pos_out[2 * j] - neg_out[2 * j] * pos_out[2 * j + 1]; // includes the conj
      }
    }
  }

  // Take magnitude of SCF
  let SCF_mag = Array.from({ length: alphas.length }, () => new Array(Nw));
  for (let i = 0; i < alphas.length; i++) {
    for (let j = 0; j < Nw; j++) {
      SCF_mag[i][j] = SCF[i][2 * j] * SCF[i][2 * j] + SCF[i][2 * j + 1] * SCF[i][2 * j + 1];
    }
    SCF_mag[i] = fftshift(SCF_mag[i]);
  }
  return SCF_mag;
}

// SCF using the freq smoothing method (1 FFT, lots of convolves)
function calc_SCF_freq_smoothing(samples, alphas, Nw) {
  const N = samples.length / 2;

  const window = Array.from({ length: Nw }, (_, i) => 0.5 * (1 - Math.cos((2 * Math.PI * i) / (Nw - 1)))); // hanning window

  // FFT entire signal
  let fft_obj = new FFT(N);
  let X = fft_obj.createComplexArray(); // output of fft
  fft_obj.transform(X, samples);

  // separate into real and imag
  const X_real = new Array(N);
  const X_imag = new Array(N);
  const X_real_rev = new Array(N);
  const X_imag_rev = new Array(N);
  for (let i = 0; i < N; i++) {
    X_real[i] = X[i * 2];
    X_imag[i] = X[i * 2 + 1];
    X_real_rev[i] = X[i * 2];
    X_imag_rev[i] = X[i * 2 + 1];
  }

  const freq_decimation = Math.floor((N / Nw) * 8); // sort of arbitrary but if we dont decimate there will be thousands of pixels horizontally
  const skip = Math.floor(N / freq_decimation);

  // outter array is for each alpha, inner array will hold magnitudes
  let SCF_mag = Array.from({ length: alphas.length }, () => new Array(freq_decimation));

  // loop through cyclic freq (alphas)
  let prev_shift = 0;

  for (let alpha_idx = 0; alpha_idx < alphas.length; alpha_idx++) {
    const shift = Math.floor((alphas[alpha_idx] * N) / 2); // scalar, number of samples to shift by
    arrayRotate(X_real, shift - prev_shift);
    arrayRotate(X_imag, shift - prev_shift);
    arrayRotate(X_real_rev, -1 * (shift - prev_shift));
    arrayRotate(X_imag_rev, -1 * (shift - prev_shift));
    prev_shift = shift;

    let real_part = new Array(N);
    let imag_part = new Array(N);
    for (let i = 0; i < N; i++) {
      // TODO: based on the code Sam had, might not need to calc for all i
      // includes the conj of the non-rev part (X_imag), otherwise its just a complex multiply
      real_part[i] = X_real_rev[i] * X_real[i] + X_imag_rev[i] * X_imag[i];
      imag_part[i] = X_imag_rev[i] * X_real[i] - X_real_rev[i] * X_imag[i];
    }

    // Apply window (a critical part to the freq smoothing method!)
    real_part = convolve(real_part, window).slice(Nw / 2, N + Nw / 2); // slice makes it like "same" mode
    imag_part = convolve(imag_part, window).slice(Nw / 2, N + Nw / 2);

    // Take magnitude squared but also decimate by Nw
    for (let i = 0; i < freq_decimation; i++) {
      SCF_mag[alpha_idx][i] = real_part[i * skip] * real_part[i * skip] + imag_part[i * skip] * imag_part[i * skip];
    }
    // FFT Shift
    SCF_mag[alpha_idx] = fftshift(SCF_mag[alpha_idx]);
  }

  return SCF_mag;
}

function calc_PSD(samples) {
  const fftsize = samples.length / 2;
  const fft = new FFT(fftsize);
  const out = fft.createComplexArray();
  fft.transform(out, samples);

  // Calculate magnitude
  let PSD = new Array(fftsize);
  for (var i = 0; i < fftsize; i++) {
    PSD[i] = Math.sqrt(out[i * 2] * out[i * 2] + out[i * 2 + 1] * out[i * 2 + 1]);
  }

  // Square the signal
  for (var i = 0; i < fftsize; i++) {
    PSD[i] = PSD[i] * PSD[i];
  }

  PSD = fftshift(PSD);

  // Convert to dB and apply scaling factor
  for (var i = 0; i < fftsize; i++) {
    PSD[i] = 10 * Math.log10(PSD[i]) - 10; // scaling factor to make peak at 9 dB (8 linear)
  }
  return PSD;
}

function convolve(x, y) {
  let result = [];
  let lenX = x.length;
  let lenY = y.length;

  // Perform convolution, using "full" mode
  for (let i = 0; i < lenX + lenY - 1; i++) {
    let sum = 0;
    for (let j = Math.max(0, i - lenY + 1); j <= Math.min(i, lenX - 1); j++) {
      sum += x[j] * y[i - j];
    }
    result.push(sum);
  }
  return result;
}

function sinc(x) {
  return x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);
}

// Standard Normal variate using Box-Muller transform.
function gaussianRandom(mean = 0, stdev = 1) {
  const u = 1 - Math.random(); // Converting [0,1) to (0,1]
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  // Transform to the desired mean and standard deviation:
  return z * stdev + mean;
}

function generate_bspk(N, fs, sps, f_offset, rolloff, noise_level, rect_checked) {
  const bits = Array.from({ length: Math.ceil(N / sps) }, () => Math.floor(Math.random() * 2)); // Our data to be transmitted, 1's and 0's
  //const bits = new Array(Math.ceil(N / sps)).fill(1);

  //startTime = performance.now();
  //let bpsk = [];
  let bpsk = new Array(N).fill(0);
  for (let i = 0; i < bits.length; i++) {
    bpsk[i * sps] = bits[i] * 2 - 1; // BPSK
  }
  //console.log(`making bpsk took ${performance.now() - startTime} ms`); // 0.5ms

  const num_taps = 101; // for our RRC filter
  let h;
  // easier than adding the math
  if (rolloff == 0.5) rolloff = 0.4999;
  if (rolloff == 0.25) rolloff = 0.2499;
  if (rolloff == 1) rolloff = 0.9999;
  if (rect_checked) {
    // rect pulses
    h = new Array(sps).fill(1);
  } else {
    // RC pulse shaping
    const t = Array.from({ length: num_taps }, (_, i) => i - (num_taps - 1) / 2);
    h = t.map((val) => {
      return (sinc(val / sps) * Math.cos((Math.PI * rolloff * val) / sps)) / (1 - ((2 * rolloff * val) / sps) ** 2);
    });
  }

  // Convolve bpsk and h
  bpsk = convolve(bpsk, h);

  bpsk = bpsk.slice(0, N); // clip off the extra samples

  // Freq shift, also is the start of it being complex, which is done with an interleaved 1d array that is twice the length
  const bpsk_complex = new Array(N * 2).fill(0);
  for (let i = 0; i < N; i++) {
    bpsk_complex[2 * i] = bpsk[i] * Math.cos((2 * Math.PI * f_offset * i) / fs);
    bpsk_complex[2 * i + 1] = bpsk[i] * Math.sin((2 * Math.PI * f_offset * i) / fs);
  }

  // Add complex white gaussian noise
  for (let i = 0; i < N; i++) {
    bpsk_complex[2 * i] += gaussianRandom() * noise_level;
    bpsk_complex[2 * i + 1] += gaussianRandom() * noise_level;
  }

  return bpsk_complex;
}
