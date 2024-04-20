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

  // useMemo is used to cache displayedIQ between rerenders, it's only recalculated when the dependencies change
  const displayedIQ = useMemo<Float32Array>(() => {
    console.log('STARTING displayedIQ RECALC');
    if (!totalFFTs || !spectrogramHeight || currentFFT < 0) {
      return null;
    }

    // get the current required and displayed FFT indices
    const requiredFFTIndices: number[] = []; // used alongside setFFTsRequired()
    const currentPadding = Math.floor(FETCH_PADDING / (fftSize / 1024));
    for (let i = -currentPadding; i < spectrogramHeight + currentPadding; i++) {
      const indx = currentFFT + i * (fftStepSize + 1);
      if (indx <= totalFFTs && indx >= 0) {
        requiredFFTIndices.push(indx);
      }
    }
    console.log('fftStepSize:', fftStepSize);
    console.log('requiredFFTIndices:', requiredFFTIndices);

    // at startup currentData wont even exist yet
    if (!currentData || currentData.length === 0) {
      setFFTsRequired(requiredFFTIndices);
      return null;
    }

    // sets the FFTs that still need to be fetched
    setFFTsRequired(requiredFFTIndices.filter((i) => !currentData[i]));

    // Grab the portion that is visible on the spectrogram right now, fill with -infty if data isnt available
    // note- currentData is essentially just 'processedIQData' key in react query
    const iqData = new Float32Array(spectrogramHeight * fftSize * 2);
    for (let i = 0; i < spectrogramHeight; i++) {
      if (currentData[currentFFT + i * (fftStepSize + 1)]) {
        iqData.set(currentData[currentFFT + i * (fftStepSize + 1)], i * fftSize * 2);
      } else {
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
