import { useGetIQData } from '@/api/iqdata/Queries';
import { useEffect, useMemo } from 'react';
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
    spectrogramHeight,
    fftStepSize,
    setFFTStepSize,
    setSpectrogramHeight,
    meta,
    taps,
    pythonSnippet,
  } = useSpectrogramContext();
  const { currentData, setFFTsRequired, fftsRequired, processedDataUpdated } = useGetIQData(
    type,
    account,
    container,
    filePath,
    fftSize,
    taps,
    pythonSnippet
  );
  const totalFFTs = Math.ceil(meta?.getTotalSamples() / fftSize);

  const debouncedCurrentFFT = useDebounce<string>(currentFFT, 200);

  // This is the list of ffts we display
  const displayedIQ = useMemo<Float32Array>(() => {
    if (!totalFFTs || !spectrogramHeight || !currentData) {
      return null;
    }
    // get the current required blocks
    const requiredBlocks: number[] = [];
    const displayedBlocks: number[] = [];

    // make the padding dependent on the size of fft so we avoid to fetch too much data for large ffts
    const currentPadding = Math.floor(FETCH_PADDING / (fftSize / 1024));
    for (let i = 0; i < spectrogramHeight; i++) {
      const nextFFT = currentFFT + i * (fftStepSize + 1);
      if (nextFFT <= totalFFTs && nextFFT >= 0) {
        requiredBlocks.push(nextFFT);
        displayedBlocks.push(nextFFT);
      }
    }
    // add the padding
    for (let i = 1; i <= currentPadding; i++) {
      let start = displayedBlocks[0];
      let end = displayedBlocks[displayedBlocks.length - 1];
      let step = i * (fftStepSize + 1);
      if (start - step >= 0) {
        requiredBlocks.push(start - step);
      }
      if (end + step <= totalFFTs) {
        requiredBlocks.push(end + step);
      }
    }

    if (!currentData) {
      setFFTsRequired(requiredBlocks);
      return null;
    }
    // check if the blocks are already loaded
    const blocksToLoad = requiredBlocks.filter((block) => !currentData[block]);
    setFFTsRequired(blocksToLoad);
    //if (blocksToLoad.length > 0) {
    //  console.debug('loading blocks', blocksToLoad);
    //}

    // return the data with 0s for the missing blocks
    const iqData = new Float32Array(spectrogramHeight * fftSize * 2);
    let offset = 0;
    for (let i = 0; i < spectrogramHeight; i++) {
      if (currentData[displayedBlocks[i]]) {
        if (currentData[displayedBlocks[i]].length + offset > iqData.length) {
          continue;
        }
        iqData.set(currentData[displayedBlocks[i]], offset);
      } else {
        if (offset + fftSize * 2 > iqData.length) {
          continue;
        }
        iqData.fill(-Infinity, offset, offset + fftSize * 2);
      }
      offset += fftSize * 2;
    }
    return iqData;
  }, [processedDataUpdated, fftSize, debouncedCurrentFFT, fftStepSize, totalFFTs, spectrogramHeight]);

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
