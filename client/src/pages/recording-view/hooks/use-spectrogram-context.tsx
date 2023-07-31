import React, { createContext, useContext, useState } from 'react';

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
}

export const SpectrogramContext = createContext<SpectrogramContextProperties>(null);

export function SpectrogramContextProvider({ children, type, account, container, filePath }) {
  const [magnitudeMin, setMagnitudeMin] = useState<number>(-100);
  const [magnitudeMax, setMagnitudeMax] = useState<number>(50);
  const [colmap, setColmap] = useState<string>('viridis');
  const [windowFunction, setWindowFunction] = useState<string>('hann');
  const [fftSize, setFFTSize] = useState<number>(1024);
  const [spectrogramHeight, setSpectrogramHeight] = useState<number>(800);
  const [spectrogramWidth, setSpectrogramWidth] = useState<number>(1024);
  const [fftStepSize, setFFTStepSize] = useState<number>(0);

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
