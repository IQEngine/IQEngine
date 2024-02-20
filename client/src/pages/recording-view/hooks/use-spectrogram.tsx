import { useGetIQData } from '@/api/iqdata/Queries';
import { useMemo } from 'react';
import { useSpectrogramContext } from './use-spectrogram-context';
import { useDebounce } from 'usehooks-ts';
import { FETCH_PADDING } from '@/utils/constants';

export function useSpectrogram(currentFFT) {
  const {
    type,
    account,
    container,
    filePath,
    fftSize,
    spectrogramHeight, // number of rows to display (each 1 pixel high)
    fftStepSize,
    setFFTStepSize,
    setSpectrogramHeight,
    meta,
    taps,
    squareSignal,
    pythonSnippet,
  } = useSpectrogramContext();

  const { currentData, setFFTsRequired, fftsRequired, processedDataUpdated } = useGetIQData(
    type,
    account,
    container,
    filePath,
    fftSize,
    taps,
    squareSignal,
    pythonSnippet,
    fftStepSize
  );
  const totalFFTs = Math.ceil(meta?.getTotalSamples() / fftSize);
  const debouncedCurrentFFT = useDebounce<string>(currentFFT, 50);

  // This is the list of ffts we display
  const displayedIQ = useMemo<Float32Array>(() => {
    if (!totalFFTs || !spectrogramHeight) {
      return null;
    }

    // get the current required and displayed FFT indices
    const requiredFFTIndices: number[] = []; // used alongside setFFTsRequired()
    const displayedFFTIndices: number[] = [];
    for (let i = 0; i < spectrogramHeight; i++) {
      const nextFFT = currentFFT + i * (fftStepSize + 1); // currentFFT is just the index of the fft corresponding to the top of the spectrogram
      if (nextFFT > totalFFTs || nextFFT < 0) {
        console.log('[use-spectrogram] SHOULDNt HAVE GOT HERE!!! C'); // doesnt normally get here
        continue;
      }
      requiredFFTIndices.push(nextFFT);
      displayedFFTIndices.push(nextFFT);
    }
    console.log('********', displayedFFTIndices);

    // add the padding to requiredFFTIndices
    const currentPadding = Math.floor(FETCH_PADDING / (fftSize / 1024)); // make the padding (which is in units of ffts) a function of the size of fft so we avoid to fetch too much data for large ffts, this was manually tweaked
    for (let i = 1; i <= currentPadding; i++) {
      let start = displayedFFTIndices[0];
      let end = displayedFFTIndices[displayedFFTIndices.length - 1];
      let step = i * (fftStepSize + 1);
      // The padding gets added to the beginning and end of the visible ffts on the screen. it cant go beyond recording size or negative
      if (start - step >= 0) requiredFFTIndices.push(start - step);
      if (end + step <= totalFFTs) requiredFFTIndices.push(end + step);
    }

    if (!currentData || Object.keys(currentData).length === 0) {
      setFFTsRequired(requiredFFTIndices);
      return null;
    }

    // check if the FFT are already loaded
    setFFTsRequired(requiredFFTIndices.filter((i) => !currentData[i]));

    // return the data with 0s for the missing FFTs
    const iqData = new Float32Array(spectrogramHeight * fftSize * 2);
    for (let i = 0; i < spectrogramHeight; i++) {
      if (currentData[displayedFFTIndices[i]]) {
        if (currentData[displayedFFTIndices[i]].length + i * fftSize * 2 > iqData.length) {
          console.log('[use-spectrogram] SHOULDNt HAVE GOT HERE!!! A'); // doesnt normally get here
          continue;
        }
        iqData.set(currentData[displayedFFTIndices[i]], i * fftSize * 2);
      } else {
        if ((i + 1) * fftSize * 2 > iqData.length) {
          console.log('[use-spectrogram] SHOULDNt HAVE GOT HERE!!! B'); // doesnt normally get here
          continue;
        }
        iqData.fill(-Infinity, i * fftSize * 2, (i + 1) * fftSize * 2);
      }
    }
    return iqData;
  }, [
    processedDataUpdated,
    fftSize,
    debouncedCurrentFFT,
    fftStepSize,
    totalFFTs,
    spectrogramHeight,
    taps,
    squareSignal,
  ]);

  return {
    totalFFTs,
    currentFFT,
    spectrogramHeight,
    displayedIQ,
    currentData,
    fftsRequired,
    setFFTStepSize,
    setSpectrogramHeight,
  };
}
