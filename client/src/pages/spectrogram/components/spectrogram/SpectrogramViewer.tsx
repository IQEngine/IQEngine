// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { Layer, Image, Stage } from 'react-konva';
import { AnnotationViewer } from '@/pages/spectrogram/components/annotation/AnnotationViewer';
import TimeSelector from './TimeSelector';
import { RulerTop } from './RulerTop';
import { RulerSide } from './RulerSide';
import ScrollBar from './ScrollBar';
import { TILE_SIZE_IN_IQ_SAMPLES, MINIMAP_FFT_SIZE } from '@/utils/constants';
import { calculateTileNumbers } from '@/utils/selector';
import { useCurrentCachedIQDataSlice } from '@/api/iqdata/Queries';

interface SpectrogramViewerProps {
  rulerTopHeight: number;
  rulerSideWidth: number;
  fftSize: number;
  upperTile: number;
  setUpperTile: (tile: number) => void;
  lowerTile: number;
  setLowerTile: (tile: number) => void;
  includeRfFreq: boolean;
  cursorsEnabled: boolean;
  fetchMinimap: boolean;
  meta: SigMFMetadata;
  setMeta: (meta: SigMFMetadata) => void;
  spectrogramHeight: number;
  spectrogramWidth: number;
  zoomLevel: number;
  handleTop: number;
  setHandleTop: (top: number) => void;
  image: any;
  setTimeSelectionStart: (time: number) => void;
  setTimeSelectionEnd: (time: number) => void;
  setMagnitudeMax: (magnitude: number) => void;
  setMagnitudeMin: (magnitude: number) => void;
  colorMap: any;
}

const SpectrogramViewer = ({
  rulerTopHeight,
  rulerSideWidth,
  fftSize,
  upperTile,
  setUpperTile,
  lowerTile,
  setLowerTile,
  includeRfFreq,
  cursorsEnabled,
  fetchMinimap,
  meta,
  setMeta,
  spectrogramHeight,
  spectrogramWidth,
  zoomLevel,
  handleTop,
  setHandleTop,
  image,
  setTimeSelectionStart,
  setTimeSelectionEnd,
  setMagnitudeMax,
  setMagnitudeMin,
  colorMap,
}: SpectrogramViewerProps) => {
  const { downloadedTiles } = useCurrentCachedIQDataSlice(meta, TILE_SIZE_IN_IQ_SAMPLES);

  const fetchAndRender = (handleTop) => {
    if (!meta) {
      return;
    }
    const calculatedTiles = calculateTileNumbers(
      handleTop,
      meta.getTotalSamples(),
      fftSize,
      spectrogramHeight,
      zoomLevel
    );
    setLowerTile(calculatedTiles.lowerTile);
    setUpperTile(calculatedTiles.upperTile);
    setHandleTop(handleTop);
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    let scrollDirection = -e.evt.wheelDeltaY / Math.abs(e.evt.wheelDeltaY) || 0;
    let scrollAmount = scrollDirection * 2;
    let presentingSize = (spectrogramHeight / (meta.getTotalSamples() / fftSize / zoomLevel)) * spectrogramHeight;
    let maxValue = spectrogramHeight - presentingSize;
    // make sure we don't scroll past the beginning or end
    let newY = handleTop + scrollAmount;
    newY = newY < 0 ? 0 : newY > maxValue ? maxValue : newY;
    fetchAndRender(newY);
  };

  return (
    <div className="flex flex-col pl-3">
      <Stage width={spectrogramWidth + 110} height={rulerTopHeight}>
        <RulerTop
          sampleRate={meta?.getSampleRate()}
          spectrogramWidth={spectrogramWidth}
          spectrogramWidthScale={spectrogramWidth / fftSize}
          includeRfFreq={includeRfFreq}
          coreFrequency={meta?.getCenterFrequency()}
        />
      </Stage>

      <div className="flex flex-row">
        <Stage width={spectrogramWidth} height={spectrogramHeight}>
          <Layer onWheel={handleWheel}>
            <Image image={image} x={0} y={0} width={spectrogramWidth} height={spectrogramHeight} />
          </Layer>
          <AnnotationViewer
            meta={meta}
            spectrogramWidthScale={spectrogramWidth / fftSize}
            fftSize={fftSize}
            lowerTile={lowerTile}
            upperTile={upperTile}
            zoomLevel={zoomLevel}
            setMeta={setMeta}
          />
          {cursorsEnabled && (
            <TimeSelector
              spectrogramWidth={spectrogramWidth}
              spectrogramHeight={spectrogramHeight}
              upperTile={upperTile}
              lowerTile={lowerTile}
              handleTimeSelectionStart={setTimeSelectionStart}
              handleTimeSelectionEnd={setTimeSelectionEnd}
            />
          )}
        </Stage>

        <Stage width={rulerSideWidth} height={spectrogramHeight} className="mr-1">
          <RulerSide
            spectrogramWidth={spectrogramWidth}
            fftSize={fftSize}
            sampleRate={meta?.getSampleRate()}
            currentRowAtTop={(lowerTile * TILE_SIZE_IN_IQ_SAMPLES) / fftSize}
            spectrogramHeight={spectrogramHeight}
          />
        </Stage>

        <Stage width={MINIMAP_FFT_SIZE + 5} height={spectrogramHeight}>
          <ScrollBar
            fetchAndRender={fetchAndRender}
            spectrogramHeight={spectrogramHeight}
            downloadedTiles={downloadedTiles}
            zoomLevel={zoomLevel}
            handleTop={handleTop}
            meta={meta}
            fetchEnabled={fetchMinimap}
            fftSize={fftSize}
            setMagnitudeMax={setMagnitudeMax}
            setMagnitudeMin={setMagnitudeMin}
            colorMap={colorMap}
          />
        </Stage>
      </div>
    </div>
  );
};

export { SpectrogramViewer };
