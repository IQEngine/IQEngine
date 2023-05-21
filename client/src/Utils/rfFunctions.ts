export function calculateDate(start: Date, count: number, sampleRate: number) {
  let time = start.getTime() + (count / sampleRate) * 1e3; // getTime() returns milliseconds
  const a = new Date(time); // Date takes in milliseconds
  return new Date(time).toISOString();
}

export function calculateSampleCount(start: Date, current: Date, sampleRate: number) {
  let time = current.getTime() - start.getTime();
  return (time * sampleRate) / 1e3;
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
  const timePico = time * 1e12;
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
