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
  const { fftSize, setFFTSize, currentData } = useGetIQData(type, account, container, filePath);
  const total_ffts = Math.ceil(meta?.getTotalSamples() / fftSize);
  const [currentFFT, setCurrentFFT] = useState<number>(0);
  // This is how many ffts we skip when decimating
  const [fftStepSize, setFFTStepSize] = useState<number>(0);
  // This is how many ffts we display
  const [spectrogramHeight, setSpectrogramHeight] = useState<number>(0);

  // This is the list of ffts we display
  const displayedFFTs = useMemo<number[]>(() => {
    const ffts = [currentFFT];
    for (let i = 1; i < spectrogramHeight; i++) {
      ffts.push(currentFFT + i * (fftStepSize + 1));
    }
    return ffts;
  }, [fftSize, currentFFT, fftStepSize, total_ffts, spectrogramHeight]);

  return {
    total_ffts,
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
  };
}
