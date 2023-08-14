import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSpectrogram } from './hooks/use-spectrogram';
import { Layer, Stage, Image } from 'react-konva';
import { useGetImage } from './hooks/use-get-image';
import { KonvaEventObject } from 'konva/lib/Node';
import { RulerTop } from './components/ruler-top';
import { RulerSide } from './components/ruler-side';
import { SpectrogramContextProvider, useSpectrogramContext } from './hooks/use-spectrogram-context';
import { CursorContextProvider, useCursorContext } from './hooks/use-cursor-context';
import { useMeta } from '@/api/metadata/queries';
import { IQPlot } from './components/iq-plot';
import { FrequencyPlot } from './components/frequency-plot';
import { TimePlot } from './components/time-plot';
import { Sidebar } from './components/sidebar';
import GlobalProperties from './components/global-properties';
import MetaViewer from './components/meta-viewer';
import MetaRaw from './components/meta-raw';
import AnnotationList from './components/annotation/annotation-list';
import ScrollBar from './components/scroll-bar';
import { MINIMAP_FFT_SIZE, MIN_SPECTROGRAM_HEIGHT } from '@/utils/constants';
import FreqSelector from './components/freq-selector';
import TimeSelector from './components/time-selector';
import { AnnotationViewer } from './components/annotation/annotation-viewer';
import TimeSelectorMinimap from './components/time-selector-minimap';
import { useWindowSize } from 'usehooks-ts';

export function DisplaySpectrogram({ currentFFT, setCurrentFFT }) {
  const {
    spectrogramWidth,
    magnitudeMin,
    magnitudeMax,
    colmap,
    windowFunction,
    fftSize,
    fftStepSize,
    meta,
    setSpectrogramWidth,
    setSpectrogramHeight,
  } = useSpectrogramContext();

  const { displayedIQ, spectrogramHeight } = useSpectrogram(currentFFT);
  const { width, height } = useWindowSize();

  useEffect(() => {
    const spectrogramHeight = height - 450; // hand-tuned for now
    //console.log('spectrogramHeight: ', spectrogramHeight);
    setSpectrogramHeight(Math.max(MIN_SPECTROGRAM_HEIGHT, spectrogramHeight));
    const newSpectrogramWidth = width - 430; // hand-tuned for now
    setSpectrogramWidth(newSpectrogramWidth);
  }, [width, height]);

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
    const scrollAmount = Math.floor(evt.evt.deltaY);
    const nextPosition = currentFFT + scrollAmount + spectrogramHeight * (fftStepSize + 1);
    const maxPosition = meta.getTotalSamples() / fftSize;

    if (nextPosition < maxPosition) {
      setCurrentFFT(Math.max(0, currentFFT + scrollAmount));
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
      <div className="flex flex-row" id="spectrogram">
        <Stage width={spectrogramWidth} height={spectrogramHeight}>
          <Layer onWheel={handleWheel}>
            <Image image={image} x={0} y={0} width={spectrogramWidth} height={spectrogramHeight} />
          </Layer>
          <AnnotationViewer currentFFT={currentFFT} />
          <FreqSelector />
          <TimeSelector currentFFT={currentFFT} />
        </Stage>
        <Stage width={50} height={spectrogramHeight} className="mr-1">
          <RulerSide currentRowAtTop={currentFFT} />
        </Stage>
        <Stage width={MINIMAP_FFT_SIZE + 5} height={spectrogramHeight}>
          <ScrollBar currentFFT={currentFFT} setCurrentFFT={setCurrentFFT} />
          <TimeSelectorMinimap currentFFT={currentFFT} />
        </Stage>
      </div>
    </>
  );
}

export function DisplayMetadataRaw() {
  const { meta } = useSpectrogramContext();
  return <MetaRaw meta={meta} />;
}

export function DisplayMetaSummary() {
  const { meta } = useSpectrogramContext();
  return <MetaViewer meta={meta} />;
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
  const [currentFFT, setCurrentFFT] = useState<number>(0);
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
          <div className="flex flex-row w-full">
            <Sidebar currentFFT={currentFFT} />
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
              {currentTab === Tab.Spectrogram && (
                <DisplaySpectrogram currentFFT={currentFFT} setCurrentFFT={setCurrentFFT} />
              )}
              {currentTab === Tab.Time && <TimePlot />}
              {currentTab === Tab.Frequency && <FrequencyPlot />}
              {currentTab === Tab.IQ && <IQPlot />}
              <DisplayMetaSummary />
            </div>
          </div>
          <div className="mt-3 mb-0 px-2 py-0" style={{ margin: '5px' }}>
            <details>
              <summary className="pl-2 mt-2 bg-primary outline outline-1 outline-primary text-lg text-base-100 hover:bg-green-800">
                Annotations
              </summary>
              <div className="outline outline-1 outline-primary p-2">
                <AnnotationList setCurrentFFT={setCurrentFFT} currentFFT={currentFFT} />
              </div>
            </details>

            <details>
              <summary className="pl-2 mt-2 bg-primary outline outline-1 outline-primary text-lg text-base-100 hover:bg-green-800">
                Global Properties
              </summary>
              <div className="outline outline-1 outline-primary p-2">
                <GlobalProperties />
              </div>
            </details>
            <details>
              <summary className="pl-2 mt-2 bg-primary outline outline-1 outline-primary text-lg text-base-100 hover:bg-green-800">
                Raw Metadata
              </summary>
              <div className="outline outline-1 outline-primary p-2">
                <DisplayMetadataRaw />
              </div>
            </details>
          </div>
        </div>
      </CursorContextProvider>
    </SpectrogramContextProvider>
  );
}
