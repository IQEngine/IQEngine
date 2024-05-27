import { useMeta } from '@/api/metadata/queries';
import { SigMFMetadata } from '@/utils/sigmfMetadata';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSpectrogramContext } from './use-spectrogram-context';
import { useGetIQData } from '@/api/iqdata/Queries';
import { useDebounceValue } from 'usehooks-ts';

interface CursorContextProperties {
  cursorTime: Cursor;
  setCursorTime: (cursorTime: Cursor) => void;
  cursorFreq: Cursor;
  setCursorFreq: (cursorFreq: Cursor) => void;
  cursorData: Float32Array;
  setCursorData: (cursorData: Float32Array) => void;
  cursorFreqEnabled: boolean;
  setCursorFreqEnabled: (cursorFreqEnabled: boolean) => void;
  cursorTimeEnabled: boolean;
  setCursorTimeEnabled: (cursorTimeEnabled: boolean) => void;
}

export const CursorContext = createContext<CursorContextProperties>(null);

interface Cursor {
  start: number;
  end: number;
}

export function CursorContextProvider({ children }) {
  const [cursorTime, setCursorTime] = useState<Cursor>({
    start: 0,
    end: 0,
  });
  const [cursorFreq, setCursorFreq] = useState<Cursor>({
    start: 0,
    end: 0,
  });

  const [cursorFreqEnabled, setCursorFreqEnabled] = useState<boolean>(false);
  const [cursorTimeEnabled, setCursorTimeEnabled] = useState<boolean>(false);

  const { type, account, container, filePath, fftSize } = useSpectrogramContext();
  const { currentData, setFFTsRequired, fftsRequired } = useGetIQData(type, account, container, filePath, fftSize);

  const [cursorData, setCursorData] = useState<Float32Array>(new Float32Array(0));
  const debounceCursorTime = useDebounceValue(cursorTime, 500);

  useEffect(() => {
    if (!currentData || !cursorTime || cursorTime.start === cursorTime.end || !cursorTimeEnabled) {
      return;
    }
    const startingFFT = Math.floor(cursorTime.start / fftSize);
    const endingFFT = Math.floor(cursorTime.end / fftSize);
    const iqData = new Float32Array((endingFFT - startingFFT) * fftSize * 2);
    let offset = 0;
    let requiredBlocks: number[] = [];
    for (let i = startingFFT; i < endingFFT; i++) {
      if (currentData[i]) {
        iqData.set(currentData[i], offset);
      } else {
        requiredBlocks.push(i);
      }
      offset += fftSize * 2;
    }
    setCursorData(iqData);
    setFFTsRequired(requiredBlocks);
  }, [debounceCursorTime, currentData, fftSize]);

  return (
    <CursorContext.Provider
      value={{
        cursorTime,
        setCursorTime,
        cursorFreq,
        setCursorFreq,
        cursorData,
        setCursorData,
        cursorFreqEnabled,
        setCursorFreqEnabled,
        cursorTimeEnabled,
        setCursorTimeEnabled,
      }}
    >
      {children}
    </CursorContext.Provider>
  );
}

export function useCursorContext() {
  const context = useContext(CursorContext);
  if (context === undefined || context === null) {
    throw new Error('useSpectrogramContext must be used within a SpectrogramContextProvider');
  }
  return context;
}
