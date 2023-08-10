import { Temporal } from '@js-temporal/polyfill';

export function calculateDate(start: string, count: number, sampleRate: number) {
  try {
    const startDate = Temporal.Instant.from(start);
    const dateInNanoseconds = Number(((count / sampleRate) * 1e9).toFixed(0));
    const date = startDate.add({ nanoseconds: dateInNanoseconds });
    return date.toString();
  } catch {
    return null;
  }
}

export function calculateSampleCount(start: string, current: string, sampleRate: number) {
  try {
    const startDate = Temporal.Instant.from(start);
    const currentDate = Temporal.Instant.from(current);
    const time = Number(currentDate.epochNanoseconds - startDate.epochNanoseconds);
    return (time * sampleRate) / 1e9;
  } catch {
    return null;
  }
}

// Prints a number in Hz, using units most appropriate
export function unitPrefixHz(freq: number) {
  if (!freq || isNaN(freq)) return { freq: 0, unit: 'Hz' };

  freq = Number(freq.toFixed(0));
  if (freq?.toString().length >= 10) {
    return { freq: freq / 1e9, unit: 'GHz' };
  }

  if (freq?.toString().length >= 7) {
    freq = Math.round(freq / 1e3) * 1e3;
    return { freq: freq / 1e6, unit: 'MHz' };
  }

  if (freq?.toString().length >= 4) {
    return { freq: freq / 1e3, unit: 'kHz' };
  }

  return { freq: freq, unit: 'Hz' };
}

export function unitPrefixHzInverse(freq: number, unit: string) {
  if (!freq || isNaN(freq)) return 0;

  if (unit === 'GHz') {
    return Number((freq * 1e9)?.toFixed(0));
  }

  if (unit === 'MHz') {
    return Number((freq * 1e6)?.toFixed(0));
  }

  if (unit === 'kHz') {
    return Number((freq * 1e3)?.toFixed(0));
  }

  return Number(freq?.toFixed(0));
}

// Prints a number in seconds, using units most appropriate
export function unitPrefixSeconds(time: number) {
  const timePico = Number((time * 1e12).toFixed(0));
  if (timePico.toString().length >= 10) {
    return { time: timePico / 1e9, unit: 'ms' };
  }

  if (timePico.toString().length >= 7) {
    return { time: timePico / 1e6, unit: 'us' };
  }

  if (timePico.toString().length >= 4) {
    return { time: timePico / 1e3, unit: 'ns' };
  }

  return { time: timePico, unit: 'ps' };
}

// Prints a number of samples, using units most appropriate
export function unitPrefixSamples(samples: number) {
  if (!samples || isNaN(samples)) return { samples: 0, unit: '' };

  samples = Number(samples.toFixed(0));
  if (samples?.toString().length >= 10) {
    return { samples: samples / 1e9, unit: 'B' };
  }

  if (samples?.toString().length >= 7) {
    samples = Math.round(samples / 1e3) * 1e3;
    return { samples: samples / 1e6, unit: 'M' };
  }

  if (samples?.toString().length >= 4) {
    return { samples: samples / 1e3, unit: 'k' };
  }

  return { samples: samples, unit: '' };
}

export function validateFrequency(value: number, minFreq: number, maxFreq: number) {
  if (Object.prototype.toString.call(value) !== '[object Number]') {
    return 'Invalid frequency';
  }
  if (value < minFreq) {
    return 'Frequency must be greater than the minimum frequency of the file';
  }
  if (value > maxFreq) {
    return 'Frequency must be less than the maximum frequency of the file';
  }
  return null;
}

export function validateDate(current: string, start: string, end: string) {
  try {
    const currentDate = Temporal.Instant.from(current);
    const startDate = Temporal.Instant.from(start);
    const endDate = Temporal.Instant.from(end);
    if (currentDate.epochMicroseconds < startDate.epochMicroseconds) {
      return 'Date must be after start of the file';
    }
    if (currentDate.epochMicroseconds > endDate.epochMicroseconds) {
      return 'Date must be before end of the file';
    }
    return null;
  } catch {
    return 'Invalid date';
  }
}

export function convertFloat32ArrayToBase64(float32Array: Float32Array) {
  return btoa(new Uint8Array(float32Array.buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
}

// TODO: could probably be made faster, without a for loop
export function convertBase64ToFloat32Array(base64String: string): Float32Array {
  const blob = atob(base64String);
  const arrayBuffer = new ArrayBuffer(blob.length);
  const dataView = new DataView(arrayBuffer);
  for (let i = 0; i < blob.length; i++) dataView.setUint8(i, blob.charCodeAt(i));
  return new Float32Array(arrayBuffer);
}

export function reshapeFFTs(
  currentFFTSize: number, currentData: Float32Array[], newFFTSize: number): Float32Array[]
{
  const newData = [];

  if (currentFFTSize % newFFTSize != 0 && newFFTSize % currentFFTSize != 0) {
    // Don't attempt to deal with sizes that don't fit neatly into each other
    // (We could do though, if needed)
    throw new Error("FFT sizes must be integer multiples of each other");
  }

  const multiplier = currentFFTSize / newFFTSize;
  if (multiplier == 1) {
    // No change, return original data
    return currentData;
  }
  else if (multiplier > 1) {
    // currentFFTSize > newFFTSize, each line in current array will
    // create multiple lines in new array
    currentData.forEach((data, i) => {
      const j = Math.floor(i * multiplier);

      // Create 'multiplier' new lines in the new array
      for (let slice = 0; slice < multiplier; slice++) {
        assert(!newData[j + slice]);
        newData[j + slice] = new Float32Array(data.slice(slice * newFFTSize * 2, (slice + 1) * newFFTSize * 2));
      }
    });
  }
  else {
    // currentFFTSize < newFFTSize, each line in new array will contain
    // multiple lines from current array
    currentData.forEach((data, i) => {
      const j = Math.floor(i * multiplier);
      if (!newData[j]) {
        newData[j] = new Float32Array(newFFTSize * 2).fill(NaN);
      }

      // Copy data into right line in new array (RHS
      // maps line in original array to it's place in the new new, larger
      // line)
      newData[j].set(data, (i % (1/multiplier)) * currentFFTSize * 2);
    });
  }

  return newData;
}
