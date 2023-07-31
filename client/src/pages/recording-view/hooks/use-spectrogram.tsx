import { useGetIQData } from '@/api/iqdata/Queries';
import { useMeta } from '@/api/metadata/queries';
import { useMemo, useState } from 'react';

interface SpectrogramProps {
  type: string;
  account: string;
  container: string;
  filePath: string;
  currentFFT?: number;
  fftStepSize?: number;
  spectrogramHeight?: number;
  fftSize?: number;
}

export function useSpectrogram({
  type,
  account,
  container,
  filePath,
  currentFFT: defaultCurrentFFT = 0,
  fftStepSize: defaultFFTStepSize = 0,
  spectrogramHeight: defaultSpectrogramHeight = 800,
  fftSize: defaultFFTSize = 1024,
}: SpectrogramProps) {
  const { data: meta, isSuccess: hasMetadata } = useMeta(type, account, container, filePath);
  const { fftSize, setFFTSize, currentData, setFFTsRequired, fftsRequired } = useGetIQData(
    type,
    account,
    container,
    filePath,
    defaultFFTSize
  );
  const totalFFTs = Math.ceil(meta?.getTotalSamples() / fftSize);
  const [currentFFT, setCurrentFFT] = useState<number>(defaultCurrentFFT);
  const [fftStepSize, setFFTStepSize] = useState<number>(defaultFFTStepSize);
  const [spectrogramHeight, setSpectrogramHeight] = useState<number>(defaultSpectrogramHeight);
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
      }
      offset += fftSize * 2;
    }
    return iqData;
  }, [currentData, fftSize, currentFFT, fftStepSize, totalFFTs, spectrogramHeight]);

  return {
    totalFFTs,
    currentFFT,
    setCurrentFFT,
    hasMetadata,
    fftStepSize,
    setFFTStepSize,
    spectrogramHeight,
    setSpectrogramHeight,
    displayedIQ,
    fftSize,
    setFFTSize,
    meta,
    currentData,
    fftsRequired,
  };
}
