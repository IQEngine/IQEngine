export function calculateDate(start: Date, count: number, sampleRate: number) {
  let time = start.getTime() + (count / sampleRate) * 1e3; // getTime() returns milliseconds
  const a = new Date(time); // Date takes in milliseconds
  return new Date(time).toISOString();
}

// Prints a number in Hz, using units most appropriate
export function printFrequency(freq: number) {
  if (freq.toString().length >= 10) {
    return (freq / 1e9).toString() + ' GHz';
  }

  if (freq.toString().length >= 7) {
    return (freq / 1e6).toString() + ' MHz';
  }

  if (freq.toString().length >= 4) {
    return (freq / 1e3).toString() + ' kHz';
  }

  return freq.toString() + ' Hz';
}

// Prints a number in seconds, using units most appropriate
export function printSeconds(time: number) {
  const timePico = time * 1e12;
  if (timePico.toString().length >= 10) {
    return (timePico / 1e9).toString() + ' ms';
  }

  if (timePico.toString().length >= 7) {
    return (timePico / 1e6).toString() + ' us';
  }

  if (timePico.toString().length >= 4) {
    return (timePico / 1e3).toString() + ' ns';
  }

  return timePico.toString() + ' ps';
}
