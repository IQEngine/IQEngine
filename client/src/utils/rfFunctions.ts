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
export function getFrequency(freq: number) {
  if (!freq || isNaN(freq)) return { freq: 0, unit: 'Hz' };

  freq = Number(freq.toFixed(0));
  if (freq?.toString().length >= 10) {
    return { freq: freq / 1e9, unit: 'GHz' };
  }

  if (freq?.toString().length >= 7) {
    return { freq: freq / 1e6, unit: 'MHz' };
  }

  if (freq?.toString().length >= 4) {
    return { freq: freq / 1e3, unit: 'kHz' };
  }

  return { freq: freq, unit: 'Hz' };
}

export function getOriginalFrequency(freq: number, unit: string) {
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
export function getSeconds(time: number) {
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
