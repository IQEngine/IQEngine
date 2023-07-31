import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSpectrogram } from './hooks/use-spectrogram';
import { Layer, Stage, Image } from 'react-konva';
import { useGetImage } from './hooks/use-get-image';
import { KonvaEventObject } from 'konva/lib/Node';
import { RulerTop } from './components/ruler-top';
import { RulerSide } from './components/ruler-side';
import { SpectrogramContextProvider, useSpectrogramContext } from './hooks/use-spectrogram-context';
import { useMeta } from '@/api/metadata/queries';

export function DisplaySpectrogram() {
  const {
    type,
    account,
    container,
    filePath,
    spectrogramWidth,
    magnitudeMin,
    magnitudeMax,
    colmap,
    windowFunction,
    fftSize,
  } = useSpectrogramContext();
  const { data: meta } = useMeta(type, account, container, filePath);

  const { currentData, displayedIQ, spectrogramHeight, currentFFT, setCurrentFFT } = useSpectrogram();

  const { image, setIQData } = useGetImage(
    fftSize,
    spectrogramHeight,
    magnitudeMin,
    magnitudeMax,
    colmap,
    windowFunction
  );
  function handleWheel(evt: KonvaEventObject<WheelEvent>): void {
    evt.evt.preventDefault();
    if (evt.evt.wheelDeltaY > 0) {
      setCurrentFFT((current) => Math.max(0, current + evt.evt.deltaY / 10));
    } else {
      setCurrentFFT((current) => Math.max(0, current - evt.evt.deltaY / 10));
    }
  }

  useEffect(() => {
    if (displayedIQ && displayedIQ.length > 0) {
      setIQData(displayedIQ);
    }
  }, [displayedIQ]);
  return (
    <>
      <Stage width={spectrogramWidth + 110} height={30}>
        <RulerTop />
      </Stage>
      <div className="flex flex-row">
        <Stage width={spectrogramWidth} height={spectrogramHeight}>
          <Layer onWheel={handleWheel}>
            <Image image={image} x={0} y={0} width={1024} height={spectrogramHeight} />
          </Layer>
        </Stage>
        <Stage width={50} height={spectrogramHeight} className="mr-1">
          <RulerSide currentRowAtTop={currentFFT} />
        </Stage>
      </div>
      {currentData && (
        <div>
          <h2>Current Data</h2>
          <div>FFT Size: {fftSize}</div>
          <div>Spectrogram Height: {spectrogramHeight}</div>
          <div>Current IQ: {currentData?.length}</div>
          <div>Displayed IQs: {displayedIQ?.length}</div>
          <div>Current FFT: {currentFFT}</div>
        </div>
      )}
    </>
  );
}

export function RecordingViewPage() {
  const { type, account, container, filePath } = useParams();
  const { data: meta } = useMeta(type, account, container, filePath);

  if (!meta) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-2xl font-bold">Loading...</div>
      </div>
    );
  }
  return (
    <SpectrogramContextProvider type={type} account={account} container={container} filePath={filePath}>
      <div className="mb-0 ml-0 mr-0 p-0 pt-3">
        <div className="p-0 ml-0 mr-0 mb-0 mt-2">
          <div className="flex flex-col pl-3">
            <DisplaySpectrogram />
          </div>
        </div>
        <div className="flex">
          {meta && (
            <div>
              <h2>Metadata</h2>
              <div>Sample Rate: {meta.getSampleRate()}</div>
              <div>Number of Samples: {meta.getTotalSamples()}</div>
            </div>
          )}
        </div>
      </div>
    </SpectrogramContextProvider>
  );
}
