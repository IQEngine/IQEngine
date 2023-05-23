import { Temporal } from '@js-temporal/polyfill';

export function calculateDate(start: Temporal.Instant, count: number, sampleRate: number) {
  let date = start.add({ microseconds: (count / sampleRate) * 1e6 }); // getTime() returns milliseconds
  return date.toString();
}

export function calculateSampleCount(start: Temporal.Instant, current: Temporal.Instant, sampleRate: number) {
  let time = Number(current.epochMicroseconds - start.epochMicroseconds);
  return (time * sampleRate) / 1e6;
}

// Prints a number in Hz, using units most appropriate
export function getFrequency(freq: number) {
  freq = Number(freq.toFixed(0));
  if (freq.toString().length >= 10) {
    return { freq: freq / 1e9, unit: 'GHz' };
  }

  if (freq.toString().length >= 7) {
    return { freq: freq / 1e6, unit: 'MHz' };
  }

  if (freq.toString().length >= 4) {
    return { freq: freq / 1e3, unit: 'kHz' };
  }

  return { freq: freq, unit: 'Hz' };
}

export function getOriginalFrequency(freq: number, unit: string) {
  if (unit === 'GHz') {
    return (freq * 1e9).toFixed(0);
  }

  if (unit === 'MHz') {
    return (freq * 1e6).toFixed(0);
  }

  if (unit === 'kHz') {
    return (freq * 1e3).toFixed(0);
  }

  return freq.toFixed(0);
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
