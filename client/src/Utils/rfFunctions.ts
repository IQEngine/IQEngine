export function calculateDate(start: Date, count: number, sampleRate: number) {
  let time = start.getTime() + count / sampleRate;
  return new Date(time).toISOString();
}

export function calculateFrequency(freq: number) {
  if (freq.toString().length >= 10) {
    return freq / 1e9 + ' GHz';
  }

  if (freq.toString().length >= 7) {
    return freq / 1e6 + ' MHz';
  }

  if (freq.toString().length >= 4) {
    return freq / 1e3 + ' KHz';
  }

  return freq + ' Hz';
}
