import { useDataCacheFunctions } from '@/api/iqdata/Queries';
import { useMeta } from '@/api/metadata/queries';
import { INITIAL_PYTHON_SNIPPET } from '@/utils/constants';
import { SigMFMetadata } from '@/utils/sigmfMetadata';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface SpectrogramContextProperties {
  type: string;
  account: string;
  container: string;
  filePath: string;
  magnitudeMin: number;
  setMagnitudeMin: (magnitudeMin: number) => void;
  magnitudeMax: number;
  setMagnitudeMax: (magnitudeMax: number) => void;
  colmap: string;
  setColmap: (colmap: string) => void;
  windowFunction: string;
  setWindowFunction: (windowFunction: string) => void;
  fftSize: number;
  setFFTSize: (fftSize: number) => void;
  spectrogramHeight: number;
  setSpectrogramHeight: (spectrogramHeight: number) => void;
  spectrogramWidth: number;
  setSpectrogramWidth: (spectrogramWidth: number) => void;
  fftStepSize: number;
  setFFTStepSize: (fftStepSize: number) => void;
  includeRfFreq: boolean;
  setIncludeRfFreq: (includeRfFreq: boolean) => void;
  taps: number[];
  setTaps: (taps: number[]) => void;
  pythonSnippet: string;
  setPythonSnippet: (pythonSnippet: string) => void;
  meta: SigMFMetadata;
  setMeta: (meta: SigMFMetadata) => void;
  canDownload: boolean;
  setCanDownload: (canDownload: boolean) => void;
  selectedAnnotation?: number;
  setSelectedAnnotation: (selectedAnnotation: number) => void;
}

export const SpectrogramContext = createContext<SpectrogramContextProperties>(null);

export function SpectrogramContextProvider({
  children,
  type,
  account,
  container,
  filePath,
  seedValues = {
    magnitudeMin: -30,
    magnitudeMax: 5,
    colmap: 'viridis',
    windowFunction: 'hann',
    fftSize: 1024,
    spectrogramHeight: 800,
    spectrogramWidth: 1024,
    fftStepSize: 0,
  },
}) {

  const [magnitudeMin, setMagnitudeMin] = useState<number>(seedValues.magnitudeMin);
  const [magnitudeMax, setMagnitudeMax] = useState<number>(seedValues.magnitudeMax);
  const [colmap, setColmap] = useState<string>(seedValues.colmap);
  const [windowFunction, setWindowFunction] = useState<string>(seedValues.windowFunction);
  const [fftSize, setFFTSize] = useState<number>(seedValues.fftSize);
  const [spectrogramHeight, setSpectrogramHeight] = useState<number>(seedValues.spectrogramHeight);
  const [spectrogramWidth, setSpectrogramWidth] = useState<number>(seedValues.spectrogramWidth);
  const [fftStepSize, setFFTStepSize] = useState<number>(seedValues.fftStepSize);
  const [includeRfFreq, setIncludeRfFreq] = useState<boolean>(false);
  const [taps, setTaps] = useState<number[]>([1]);
  const [pythonSnippet, setPythonLocalSnippet] = useState<string>(INITIAL_PYTHON_SNIPPET);
  const { data: originMeta } = useMeta(type, account, container, filePath);
  const [meta, setMeta] = useState<SigMFMetadata>(originMeta);
  const [canDownload, setCanDownload] = useState<boolean>(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<number>();
  const { clearIQData } = useDataCacheFunctions(type, account, container, filePath, fftSize);

  function setPythonSnippet(pythonParameterSnippet: string) {
    clearIQData();
    setPythonLocalSnippet(pythonParameterSnippet);
  }

  useEffect(() => {
    setMeta(originMeta);
  }, [originMeta]);

  return (
    <SpectrogramContext.Provider
      value={{
        type,
        account,
        container,
        filePath,
        magnitudeMin,
        setMagnitudeMin,
        magnitudeMax,
        setMagnitudeMax,
        colmap,
        setColmap,
        windowFunction,
        setWindowFunction,
        fftSize,
        setFFTSize,
        spectrogramHeight,
        setSpectrogramHeight,
        spectrogramWidth,
        setSpectrogramWidth,
        fftStepSize,
        setFFTStepSize,
        includeRfFreq,
        setIncludeRfFreq,
        taps,
        setTaps,
        pythonSnippet,
        setPythonSnippet,
        meta,
        setMeta,
        canDownload,
        setCanDownload,
        selectedAnnotation,
        setSelectedAnnotation,
      }}
    >
      {children}
    </SpectrogramContext.Provider>
  );
}

export function useSpectrogramContext() {
  const context = useContext(SpectrogramContext);
  if (context === undefined || context === null) {
    throw new Error('useSpectrogramContext must be used within a SpectrogramContextProvider');
  }
  return context;
}
