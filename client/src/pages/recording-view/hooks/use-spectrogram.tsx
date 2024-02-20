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
    const currentPadding = Math.floor(FETCH_PADDING / (fftSize / 1024));
    for (let i = -currentPadding; i < spectrogramHeight + currentPadding; i++) {
      const nextFFT = currentFFT + i * (fftStepSize + 1);
      if (nextFFT <= totalFFTs && nextFFT >= 0) {
        requiredFFTIndices.push(nextFFT);
      }
    }

    // at startup currentData wont even exist yet
    if (!currentData) {
      setFFTsRequired(requiredFFTIndices);
      return null;
    }

    // sets the FFTs that still need to be fetched
    setFFTsRequired(requiredFFTIndices.filter((i) => !currentData[i]));

    // Grab the portion that is visible on the spectrogram right now
    const iqData = new Float32Array(spectrogramHeight * fftSize * 2);
    let offset = 0;
    for (let i = 0; i < spectrogramHeight; i++) {
      if (currentData[requiredFFTIndices[i + currentPadding]]) {
        iqData.set(currentData[requiredFFTIndices[i + currentPadding]], offset);
      } else {
        iqData.fill(-Infinity, offset, offset + fftSize * 2);
      }
      offset += fftSize * 2;
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
