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
  // This is how many ffts we skip when decimating
  const [fftStepSize, setFFTStepSize] = useState<number>(0);
  // This is how many ffts we display
  const [spectrogramHeight, setSpectrogramHeight] = useState<number>(0);
  console.log(
    `useSpectrogram: ${type}, ${account}, ${container}, ${filePath} ${fftSize} ${currentFFT} ${totalFFTs}, ${spectrogramHeight}, ${fftStepSize}, ${meta}`
  );
  // This is the list of ffts we display
  const displayedFFTs = useMemo<number[]>(() => {
    const ffts = [currentFFT];
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
