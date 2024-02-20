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

    // get the current required and displayed blocks
    const requiredBlocks: number[] = []; // used alongside setFFTsRequired()
    const displayedBlocks: number[] = [];
    for (let i = 0; i < spectrogramHeight; i++) {
      const nextFFT = currentFFT + i * (fftStepSize + 1);
      if (nextFFT <= totalFFTs && nextFFT >= 0) {
        requiredBlocks.push(nextFFT);
        displayedBlocks.push(nextFFT);
      }
    }

    // add the padding to requiredBlocks
    const currentPadding = Math.floor(FETCH_PADDING / (fftSize / 1024)); // make the padding (which is in units of ffts) a function of the size of fft so we avoid to fetch too much data for large ffts, this was manually tweaked
    for (let i = 1; i <= currentPadding; i++) {
      let start = displayedBlocks[0];
      let end = displayedBlocks[displayedBlocks.length - 1];
      let step = i * (fftStepSize + 1);
      // The padding gets added to the beginning and end of the visible ffts on the screen. it cant go beyond recording size or negative
      if (start - step >= 0) requiredBlocks.push(start - step);
      if (end + step <= totalFFTs) requiredBlocks.push(end + step);
    }

    if (!currentData || Object.keys(currentData).length === 0) {
      setFFTsRequired(requiredBlocks);
      return null;
    }

    // check if the blocks are already loaded
    const blocksToLoad = requiredBlocks.filter((block) => !currentData[block]);
    setFFTsRequired(blocksToLoad);

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
          //console.log('GOT HERE A'); // doesnt normally get here
          continue;
        }
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
