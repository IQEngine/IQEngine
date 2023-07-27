import { useGetIQData } from '@/api/iqdata/Queries';
import { useMeta } from '@/api/metadata/Queries';
import { useMemo, useState } from 'react';

interface SpectrogramProps {
  type: string;
  account: string;
  container: string;
  filePath: string;
}

export function useSpectrogram({ type, account, container, filePath }: SpectrogramProps) {
  const { data: meta, isSuccess: hasMetadata } = useMeta(type, account, container, filePath);
  const [fftsRequired, setFFTsRequired] = useState<number[]>([]);
  const { fftSize, setFFTSize, currentData } = useGetIQData(type, account, container, filePath, fftsRequired);
  const totalFFTs = Math.ceil(meta?.getTotalSamples() / fftSize);
  const [currentFFT, setCurrentFFT] = useState<number>(0);
  const [fftStepSize, setFFTStepSize] = useState<number>(0);
  const [spectrogramHeight, setSpectrogramHeight] = useState<number>(0);
  // This is the list of ffts we display
  const displayedFFTs = useMemo<number[]>(() => {
    if (currentFFT === undefined || fftStepSize === undefined || totalFFTs === undefined || !spectrogramHeight) {
      return [];
    }
    let ffts = [currentFFT];
    for (let i = 1; i < spectrogramHeight; i++) {
      ffts.push(currentFFT + i * (fftStepSize + 1));
    }
    // filter currentData to only include the ffts we need
    for (let i = 0; i < ffts.length; i++) {
      if (ffts[i] >= totalFFTs) {
        ffts.splice(i, 1);
        i--;
      }
    }

    ffts = ffts.filter((fft) => !currentData || currentData[fft] === undefined);
    setFFTsRequired(ffts);

    return ffts;
  }, [fftSize, currentFFT, fftStepSize, totalFFTs, spectrogramHeight]);

  return {
    totalFFTs,
    currentFFT,
    setCurrentFFT,
    hasMetadata,
    fftStepSize,
    setFFTStepSize,
    spectrogramHeight,
    setSpectrogramHeight,
    displayedFFTs,
    fftSize,
    setFFTSize,
    meta,
    currentData,
  };
}
