/// <reference lib="webworker" />

import webfft, { ProfileResult } from 'webfft';

onmessage = (e: MessageEvent<[number, number]>) => {
  const [fftSize, duration] = e.data;
  const fft = new webfft(fftSize);
  const profileObj: ProfileResult = fft.profile(duration);
  fft.dispose();

  self.postMessage(profileObj);
};
