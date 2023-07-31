import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSpectrogram } from './hooks/use-spectrogram';
import { Layer, Stage, Image } from 'react-konva';
import { useGetImage } from './hooks/use-get-image';
import { KonvaEventObject } from 'konva/lib/Node';
import { RulerTop } from './components/ruler-top';
import { RulerSide } from './components/ruler-side';
import { MINIMAP_FFT_SIZE } from '@/utils/constants';

export function RecordingViewPage() {
  const { type, account, container, filePath } = useParams();
  const [spectrogramWidth, setSpectrogramWidth] = useState<number>(1024);
  const [magnitudeMin, setMagnitudeMin] = useState<number>(-50);
  const [magnitudeMax, setMagnitudeMax] = useState<number>(100);
  const [colmap, setColmap] = useState<string>('viridis');
  const [windowFunction, setWindowFunction] = useState<string>('square');
  const {
    currentData,
    displayedIQ,
    fftSize,
    spectrogramHeight,
    meta,
    currentFFT,
    fftStepSize,
    setSpectrogramHeight,
    setCurrentFFT,
    setFFTSize,
  } = useSpectrogram({
    type,
    account,
    container,
    filePath,
    currentFFT: 0,
    fftStepSize: 0,
    spectrogramHeight: 800,
    fftSize: 1024,
  });

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

  if (!meta) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-2xl font-bold">Loading...</div>
      </div>
    );
  }
  return (
    <div className="mb-0 ml-0 mr-0 p-0 pt-3">
      <div className="p-0 ml-0 mr-0 mb-0 mt-2">
        <div className="flex flex-col pl-3">
          <Stage width={spectrogramWidth + 110} height={30}>
            <RulerTop
              sampleRate={meta.getSampleRate()}
              spectrogramWidth={spectrogramWidth}
              spectrogramWidthScale={spectrogramWidth / fftSize}
              includeRfFreq={false}
              coreFrequency={meta.getCenterFrequency()}
            />
          </Stage>
          <div className="flex flex-row">
            <Stage width={spectrogramWidth} height={spectrogramHeight}>
              <Layer onWheel={handleWheel}>
                <Image image={image} x={0} y={0} width={1024} height={spectrogramHeight} />
              </Layer>
            </Stage>
            <Stage width={50} height={spectrogramHeight} className="mr-1">
              <RulerSide
                spectrogramWidth={spectrogramWidth}
                fftSize={fftSize}
                sampleRate={meta?.getSampleRate()}
                currentRowAtTop={currentFFT / fftSize}
                spectrogramHeight={spectrogramHeight}
              />
            </Stage>
          </div>
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
      </div>
    </div>
  );
}
