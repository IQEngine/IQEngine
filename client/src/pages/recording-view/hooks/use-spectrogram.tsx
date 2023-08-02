import { useGetIQData } from '@/api/iqdata/Queries';
import { useMemo } from 'react';
import { useSpectrogramContext } from './use-spectrogram-context';

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
  } = useSpectrogramContext();
  const { currentData, setFFTsRequired, fftsRequired } = useGetIQData(type, account, container, filePath, fftSize);
  const totalFFTs = Math.ceil(meta?.getTotalSamples() / fftSize);
  // This is the list of ffts we display
  const displayedIQ = useMemo<Float32Array>(() => {
    if (!totalFFTs || !spectrogramHeight || !currentData) {
      return null;
    }
    // get the current required blocks
    const requiredBlocks: number[] = [];
    for (let i = 0; i < spectrogramHeight; i++) {
      requiredBlocks.push(currentFFT + i * (fftStepSize + 1));
    }
    if (!currentData) {
      setFFTsRequired(requiredBlocks);
      return null;
    }
    // check if the blocks are already loaded
    const blocksToLoad = requiredBlocks.filter((block) => !currentData[block]);
    setFFTsRequired(blocksToLoad);

    console.log('blocks to load', blocksToLoad);

    // return the data with 0s for the missing blocks
    const iqData = new Float32Array(spectrogramHeight * fftSize * 2);
    let offset = 0;
    for (let i = 0; i < spectrogramHeight; i++) {
      if (currentData[requiredBlocks[i]]) {
        iqData.set(currentData[requiredBlocks[i]], offset);
      } else {
        iqData.fill(-Infinity, offset, offset + fftSize * 2);
      }
      offset += fftSize * 2;
    }
    return iqData;
  }, [currentData, fftSize, currentFFT, fftStepSize, totalFFTs, spectrogramHeight]);

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
