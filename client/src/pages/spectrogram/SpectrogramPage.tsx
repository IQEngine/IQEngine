// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { Sidebar } from './Sidebar';
import ScrollBar from './ScrollBar';
import { TimePlot } from './components/TimePlot';
import { FrequencyPlot } from './components/FrequencyPlot';
import { IQPlot } from './components/IQPlot';
import { Layer, Image, Stage } from 'react-konva';
import { selectFft, calculateTileNumbers, range, SelectFftReturn } from '@/utils/selector';
import { AnnotationViewer } from '@/pages/spectrogram/components/annotation/AnnotationViewer';
import { RulerTop } from './RulerTop';
import { RulerSide } from './RulerSide';
import { INITIAL_PYTHON_SNIPPET, TILE_SIZE_IN_IQ_SAMPLES, COLORMAP_DEFAULT, MINIMAP_FFT_SIZE } from '@/utils/constants';
import TimeSelector from './TimeSelector';
import AnnotationList from '@/pages/spectrogram/components/annotation/AnnotationList';
import { GlobalProperties } from '@/pages/spectrogram/components/global-properties/GlobalProperties';
import { MetaViewer } from '@/pages/spectrogram/components/metadata/MetaViewer';
import { MetaRaw } from '@/pages/spectrogram/components/metadata/MetaRaw';
import { useParams } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { getMeta } from '@/api/metadata/Queries';
import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { getIQDataSlices, useCurrentCachedIQDataSlice } from '@/api/iqdata/Queries';
import { applyProcessing } from '@/utils/FetchMoreDataSource';
import { colMaps } from '@/utils/colormap';

declare global {
  interface Window {
    loadPyodide: any;
  }
}

async function initPyodide() {
  const pyodide = await window.loadPyodide();
  await pyodide.loadPackage('numpy');
  await pyodide.loadPackage('matplotlib');
  return pyodide;
}

export const SpectrogramPage = () => {
  const rulerSideWidth = 50;
  const rulerTopHeight = 30;
  const marginTop = 30;
  const { type, account, container, filePath, sasToken } = useParams();
  const imgRef = useRef<HTMLImageElement>(null);
  const imgRef2 = useRef<HTMLImageElement>(null);

  // FFT Properties
  const [fftSize, setFFTSize] = useState(1024);
  const [magnitudeMax, setMagnitudeMax] = useState(-10.0); // in dB
  const [magnitudeMin, setMagnitudeMin] = useState(-40.0); // in dB
  const [fftWindow, setFFTWindow] = useState('hamming');
  const [colorMap, setColorMap] = useState(colMaps[COLORMAP_DEFAULT]);
  const [image, setImage] = useState(null);
  const [upperTile, setUpperTile] = useState(-1);
  const [lowerTile, setLowerTile] = useState(-1);
  const [currentSamples, setCurrentSamples] = useState<Float32Array>(Float32Array.from([]));
  const [spectrogramHeight, setSpectrogramHeight] = useState(800);
  const [spectrogramWidth, setSpectrogramWidth] = useState(1000);
  const [timeSelectionStart, setTimeSelectionStart] = useState(0);
  const [timeSelectionEnd, setTimeSelectionEnd] = useState(10);
  const [cursorsEnabled, setCursorsEnabled] = useState(false);
  const [currentTab, setCurrentTab] = useState('spectrogram');
  const [pyodide, setPyodide] = useState(null);
  const [handleTop, setHandleTop] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [includeRfFreq, setIncludeRfFreq] = useState(false);
  const [plotWidth, setPlotWidth] = useState(0);
  const [plotHeight, setPlotHeight] = useState(0);
  const [missingTiles, setMissingTiles] = useState([]);
  const metaQuery = getMeta(type, account, container, filePath);
  const tiles = range(Math.floor(lowerTile), Math.ceil(upperTile));
  const [fftData, setFFTData] = useState<Record<number, Float32Array>>({});
  const [meta, setMeta] = useState<SigMFMetadata>(metaQuery.data);
  const [taps, setTaps] = useState<number[]>([1]);
  const [pythonSnippet, setPythonSnippet] = useState(INITIAL_PYTHON_SNIPPET);
  const [fetchMinimap, setFetchMinimap] = useState(false);
  const [iqData, setIQData] = useState<Record<number, Float32Array>>({});
  const [iqRaw, setIQRaw] = useState<Record<number, Float32Array>>({});
  const [fftImage, setFFTImage] = useState<SelectFftReturn>(null);
  const { downloadedTiles } = useCurrentCachedIQDataSlice(meta, TILE_SIZE_IN_IQ_SAMPLES);
  const iqQuery = getIQDataSlices(metaQuery.data, tiles, TILE_SIZE_IN_IQ_SAMPLES, !!metaQuery.data && tiles.length > 0);

  useEffect(() => {
    if (!pyodide) {
      initPyodide().then((pyodide) => {
        setPyodide(pyodide);
      });
    }
  }, []);

  useEffect(() => {
    let data = iqQuery
      .map((slice) => slice.data)
      .filter((data) => data !== null)
      .reduce((acc, data) => {
        if (!data || !!iqRaw[data.index]) {
          return acc;
        }
        acc[data.index] = data.iqArray;
        return acc;
      }, {});
    setIQRaw((oldData) => {
      return { ...oldData, ...data };
    });
  }, [iqQuery.reduce((previous, current) => previous + current.dataUpdatedAt, '')]);

  useEffect(() => {
    (async () => {
      let data = Object.keys(iqRaw).reduce((acc, index) => {
        let iqArray = iqRaw[index];
        if (!iqArray) {
          return acc;
        }
        let iqArrayTransformed = applyProcessing(iqArray, taps, pythonSnippet, pyodide);
        acc[index] = iqArrayTransformed;
        return acc;
      }, {});
      setFFTData({});
      setIQData(data);
    })();
  }, [pythonSnippet, taps, pyodide]);

  useEffect(() => {
    console.debug('IQ Raw Changed');
    let data = Object.keys(iqRaw).reduce((acc, index) => {
      let iqArray = iqRaw[index];
      if (!iqArray || !!iqData[index]) {
        return acc;
      }
      let iqArrayTransformed = applyProcessing(iqArray, taps, pythonSnippet, pyodide);
      acc[index] = iqArrayTransformed;
      return acc;
    }, {});
    console.debug('Setting IQ Data', data);
    setIQData((oldData) => {
      return { ...oldData, ...data };
    });
  }, [iqRaw]);

  useEffect(() => {
    if (!meta || lowerTile < 0 || upperTile < 0) {
      return;
    }
    console.debug('FFT Changed');
    const ret = selectFft(
      lowerTile,
      upperTile,
      fftSize,
      magnitudeMax,
      magnitudeMin,
      meta,
      fftWindow, // dont want to conflict with the main window var
      zoomLevel,
      iqData,
      {},
      colorMap
    );
    setFFTData(ret?.fftData);
    setFFTImage(ret);
  }, [fftSize, magnitudeMax, magnitudeMin, fftWindow, zoomLevel, colorMap]);

  useEffect(() => {
    if (!meta || lowerTile < 0 || upperTile < 0) {
      return;
    }
    console.debug('FFT Repositioned');
    const ret = selectFft(
      lowerTile,
      upperTile,
      fftSize,
      magnitudeMax,
      magnitudeMin,
      meta,
      fftWindow, // dont want to conflict with the main window var
      zoomLevel,
      iqData,
      fftData,
      colorMap
    );
    setFFTData(ret?.fftData);
    setFFTImage(ret);
  }, [lowerTile, upperTile, missingTiles.length, iqData]);

  useEffect(() => {
    renderImage();
  }, [fftImage]);

  const renderImage = async () => {
    if (!fftImage) {
      return;
    }
    createImageBitmap(fftImage.imageData).then((imageBitmap) => {
      setImage(imageBitmap);
    });
    setMissingTiles(fftImage.missingTiles);
    setFetchMinimap(true);
  };

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

  function windowResized() {
    if (!meta) {
      return;
    }
    // Calc the area to be filled by the spectrogram
    const windowHeight = window.innerHeight;
    const topRowHeight = document.getElementById('topRow').offsetHeight;
    const tabsHeight = document.getElementById('tabsbar').offsetHeight;
    const newSpectrogramHeight = windowHeight - topRowHeight - marginTop - tabsHeight - rulerTopHeight - 140;
    setSpectrogramHeight(newSpectrogramHeight);
    const newSpectrogramWidth = window.innerWidth - 430; // hand-tuned for now
    setSpectrogramWidth(newSpectrogramWidth);

    // Time/Freq/IQ Plot width/height
    const newplotWidth = window.innerWidth - 330;
    const newPlotHeight = newSpectrogramHeight - 100;
    setPlotWidth(newplotWidth);
    setPlotHeight(newPlotHeight);
  };

  useEffect(() => {
    setMeta(metaQuery.data);
  }, [metaQuery.data]);

  useEffect(() => {
    if (meta) {
      console.log('fetching and rendering tiles', meta);
      fetchAndRender(handleTop);
    }
  }, [meta, zoomLevel, handleTop, spectrogramWidth, spectrogramHeight]);

  useEffect(() => {
    window.addEventListener('resize', windowResized);
    windowResized();
    return () => {
      window.removeEventListener('resize', windowResized);
    }
  }, [meta]);

  const toggleIncludeRfFreq = () => {
    setIncludeRfFreq(!includeRfFreq);
  };

  const handleProcessTime = () => {
    if (!meta) {
      return;
    }
    // these 2 are in units of tile (incl fraction of a tile)
    // Concatenate and trim the IQ Data associated with this range of samples
    const tiles = range(Math.floor(timeSelectionStart), Math.ceil(timeSelectionEnd)); //non-inclusive of end, e.g. if it ends with tile 7.2 we only want tile 7 not 8
    let bufferLen = tiles?.length * TILE_SIZE_IN_IQ_SAMPLES * 2; // number of floats

    let currentSamples = new Float32Array(bufferLen);
    let counter = 0;
    for (let tile of tiles) {
      if (iqData[tile] !== undefined) {
        currentSamples.set(iqData[tile], counter);
      } else {
        console.debug('Dont have iqData of tile', tile, 'yet');
      }
      counter = counter + TILE_SIZE_IN_IQ_SAMPLES * 2; // in floats
    }

    // Trim off the top and bottom
    let lowerTrim = Math.floor((timeSelectionStart - Math.floor(timeSelectionStart)) * TILE_SIZE_IN_IQ_SAMPLES * 2); // floats to get rid of at start
    if (lowerTrim % 2 == 1) lowerTrim--; // must be even, since IQ
    let upperTrim = Math.floor((1 - (timeSelectionEnd - Math.floor(timeSelectionEnd))) * TILE_SIZE_IN_IQ_SAMPLES * 2); // floats to get rid of at end
    if (upperTrim % 2 == 1) upperTrim--; // must be even, since IQ
    const trimmedSamples = currentSamples.slice(lowerTrim, bufferLen - upperTrim); // slice uses (start, end]
    setCurrentSamples(trimmedSamples);

    const startSampleOffset = timeSelectionStart * TILE_SIZE_IN_IQ_SAMPLES; // in IQ samples
    return { trimmedSamples: trimmedSamples, startSampleOffset: startSampleOffset }; // only used by plugins
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
    <>
      {status === 'loading' && <h1>Loading...</h1>}
      <div className="mb-0 ml-0 mr-0 p-0 pt-3">
        <div className="flex flex-row w-full">
          <Sidebar
            updateMagnitudeMax={setMagnitudeMax}
            updateMagnitudeMin={setMagnitudeMin}
            updateFftsize={setFFTSize}
            updateWindowChange={setFFTWindow}
            magnitudeMax={magnitudeMax}
            magnitudeMin={magnitudeMin}
            cursorsEnabled={cursorsEnabled}
            handleProcessTime={handleProcessTime}
            toggleCursors={(e) => {
              setCursorsEnabled(e.target.checked);
            }}
            toggleIncludeRfFreq={toggleIncludeRfFreq}
            updateZoomLevel={setZoomLevel}
            zoomLevel={zoomLevel}
            taps={taps}
            setTaps={setTaps}
            setZoomLevel={setZoomLevel}
            setPythonSnippet={setPythonSnippet}
            pythonSnippet={pythonSnippet}
            meta={meta}
            setMeta={setMeta}
            colorMap={colorMap}
            setColorMap={setColorMap}
          />
          <div className="flex flex-col">
            <ul className="flex space-x-2 border-b border-primary w-full sm:pl-12 lg:pl-32" id="tabsbar">
              <li>
                <div
                  onClick={() => {
                    handleProcessTime();
                    setCurrentTab('spectrogram');
                  }}
                  className={` ${
                    currentTab === 'spectrogram' ? 'bg-primary !text-base-100' : ''
                  } inline-block px-3 py-0 outline  outline-primary outline-1 text-lg text-primary hover:text-accent hover:shadow-lg hover:shadow-accent`}
                >
                  Spectrogram
                </div>
              </li>
              <li>
                <div
                  onClick={() => {
                    handleProcessTime();
                    setCurrentTab('time');
                  }}
                  className={` ${
                    currentTab === 'time' ? 'bg-primary !text-base-100' : ''
                  } inline-block px-3 py-0 outline outline-primary outline-1 text-lg text-primary hover:text-accent hover:shadow-lg hover:shadow-accent`}
                >
                  Time
                </div>
              </li>
              <li>
                <div
                  onClick={() => {
                    handleProcessTime();
                    setCurrentTab('frequency');
                  }}
                  className={` ${
                    currentTab === 'frequency' ? 'bg-primary !text-base-100' : ''
                  } inline-block px-3 py-0 outline  outline-primary outline-1 text-lg text-primary hover:text-accent hover:shadow-lg hover:shadow-accent`}
                >
                  Frequency
                </div>
              </li>
              <li>
                <div
                  onClick={() => {
                    handleProcessTime();
                    setCurrentTab('iq');
                  }}
                  className={` ${
                    currentTab === 'iq' ? 'bg-primary !text-base-100' : ''
                  } inline-block px-3 py-0 outline  outline-primary outline-1 text-lg text-primary hover:text-accent hover:shadow-lg hover:shadow-accent`}
                >
                  IQ Plot
                </div>
              </li>
            </ul>
            <div className="p-0 ml-0 mr-0 mb-0 mt-2">
              <div className={currentTab === 'spectrogram' ? 'block' : 'hidden'}>
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
              </div>
              <div className={currentTab === 'time' ? 'block' : 'hidden'}>
                {/* Reduces lag by only rendering the time/freq/iq components when they are selected */}
                {currentTab === 'time' && (
                  <TimePlot
                    currentSamples={currentSamples}
                    cursorsEnabled={cursorsEnabled}
                    plotWidth={plotWidth}
                    plotHeight={plotHeight}
                  />
                )}
              </div>
              <div className={currentTab === 'frequency' ? 'block' : 'hidden'}>
                {currentTab === 'frequency' && (
                  <FrequencyPlot
                    currentSamples={currentSamples}
                    cursorsEnabled={cursorsEnabled}
                    plotWidth={plotWidth}
                    plotHeight={plotHeight}
                  />
                )}
              </div>
              <div className={currentTab === 'iq' ? 'block' : 'hidden'}>
                {currentTab === 'iq' && (
                  <IQPlot
                    currentSamples={currentSamples}
                    cursorsEnabled={cursorsEnabled}
                    plotWidth={plotWidth}
                    plotHeight={plotHeight}
                  />
                )}
              </div>
            </div>
            <MetaViewer meta={meta} />
          </div>
        </div>
        <div className="mt-3 mb-0 px-2 py-0" style={{ margin: '5px' }}>
          <details>
            <summary className="pl-2 mt-2 bg-primary outline outline-1 outline-primary text-lg text-base-100 hover:bg-green-800">
              Annotations
            </summary>
            <div className="outline outline-1 outline-primary p-2">
              {meta && (
                <AnnotationList
                  meta={meta}
                  setHandleTop={setHandleTop}
                  spectrogramHeight={spectrogramHeight}
                  setMeta={setMeta}
                />
              )}
            </div>
          </details>

          <details>
            <summary className="pl-2 mt-2 bg-primary outline outline-1 outline-primary text-lg text-base-100 hover:bg-green-800">
              Global Properties
            </summary>
            <div className="outline outline-1 outline-primary p-2">
              <GlobalProperties meta={meta} setMeta={setMeta} />
            </div>
          </details>

          <details>
            <summary className="pl-2 mt-2 bg-primary outline outline-1 outline-primary text-lg text-base-100 hover:bg-green-800">
              Raw Metadata
            </summary>
            <div className="outline outline-1 outline-primary p-2">{meta && <MetaRaw meta={meta} />}</div>
          </details>
        </div>
      </div>
      <img ref={imgRef} />
      <img ref={imgRef2} />
    </>
  );
};

export default SpectrogramPage;
