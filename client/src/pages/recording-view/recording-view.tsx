import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSpectrogram } from './hooks/use-spectrogram';
import { Layer, Stage, Image } from 'react-konva';
import { useGetImage } from './hooks/use-get-image';
import { KonvaEventObject } from 'konva/lib/Node';
import { RulerTop } from './components/ruler-top';
import { RulerSide } from './components/ruler-side';
import { SpectrogramContextProvider, useSpectrogramContext } from './hooks/use-spectrogram-context';
import { CursorContextProvider } from './hooks/use-cursor-context';
import { useMeta } from '@/api/metadata/queries';
import { IQPlot } from './components/iq-plot';
import { FrequencyPlot } from './components/frequency-plot';
import { TimePlot } from './components/time-plot';

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

export function DisplayTime() {
  return <div></div>;
}

enum Tab {
  Spectrogram,
  Time,
  Frequency,
  IQ,
}

export function RecordingViewPage() {
  const { type, account, container, filePath } = useParams();
  const { data: meta } = useMeta(type, account, container, filePath);
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.Spectrogram);
  const Tabs = Object.keys(Tab).filter((key) => isNaN(Number(key)));

  if (!meta) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-2xl font-bold">Loading...</div>
      </div>
    );
  }
  return (
    <SpectrogramContextProvider type={type} account={account} container={container} filePath={filePath}>
      <CursorContextProvider>
        <div className="mb-0 ml-0 mr-0 p-0 pt-3">
          <div className="p-0 ml-0 mr-0 mb-0 mt-2">
            <div className="flex flex-col pl-3">
              <div className="flex space-x-2 border-b border-primary w-full sm:pl-12 lg:pl-32" id="tabsbar">
                {Tabs.map((key) => {
                  return (
                    <div
                      key={key}
                      onClick={() => {
                        setCurrentTab(Tab[key as keyof typeof Tab]);
                      }}
                      className={` ${
                        currentTab === Tab[key as keyof typeof Tab] ? 'bg-primary !text-base-100' : ''
                      } inline-block px-3 py-0 outline outline-primary outline-1 text-lg text-primary hover:text-accent hover:shadow-lg hover:shadow-accent`}
                    >
                      {key}
                    </div>
                  );
                })}
              </div>
              {currentTab === Tab.Spectrogram && <DisplaySpectrogram />}
              {currentTab === Tab.Time && <TimePlot />}
              {currentTab === Tab.Frequency && <FrequencyPlot />}
              {currentTab === Tab.IQ && <IQPlot />}
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
      </CursorContextProvider>
    </SpectrogramContextProvider>
  );
}
