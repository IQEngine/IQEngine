// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { Sidebar } from './Sidebar';
import ScrollBar from './ScrollBar';
import { TimePlot } from './TimePlot';
import { FrequencyPlot } from './FrequencyPlot';
import { IQPlot } from './IQPlot';
import { Layer, Image, Stage } from 'react-konva';
import { selectFft, calculateTileNumbers, range, SelectFftReturn } from '@/Utils/selector';
import { AnnotationViewer } from '@/Components/Annotation/AnnotationViewer';
import { RulerTop } from './RulerTop';
import { RulerSide } from './RulerSide';
import { INITIAL_PYTHON_SNIPPET, TILE_SIZE_IN_IQ_SAMPLES } from '@/Utils/constants';
import TimeSelector from './TimeSelector';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import AnnotationList from '@/Components/Annotation/AnnotationList';
import { GlobalProperties } from '@/Components/GlobalProperties/GlobalProperties';
import { MetaViewer } from '@/Components/MetaViewer/MetaViewer';
import { SpectrogramContext } from './SpectrogramContext';
import { useParams } from 'react-router-dom';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getMeta } from '@/api/metadata/Queries';
import { SigMFMetadata } from '@/Utils/sigmfMetadata';
import { getIQDataSlices, useCurrentCachedIQDataSlice } from '@/api/iqdata/Queries';
import { IQDataSlice } from '@/api/Models';
import { useInterval } from 'usehooks-ts';
import { python } from '@codemirror/lang-python';
import { applyProcessing } from '@/Sources/FetchMoreDataSource';
import { useQueryClient } from '@tanstack/react-query';

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
  const [magnitudeMax, setMagnitudeMax] = useState(240);
  const [magnitudeMin, setMagnitudeMin] = useState(80);
  const [fftWindow, setFFTWindow] = useState('hamming');
  const [autoscale, setAutoscale] = useState(false);
  const [image, setImage] = useState(null);
  const [upperTile, setUpperTile] = useState(-1);
  const [lowerTile, setLowerTile] = useState(-1);
  const [currentSamples, setCurrentSamples] = useState<Float32Array>(Float32Array.from([]));
  const [spectrogramHeight, setSpectrogramHeight] = useState(800);
  const [spectrogramWidth, setSpectrogramWidth] = useState(1000);
  const [timeSelectionStart, setTimeSelectionStart] = useState(0);
  const [timeSelectionEnd, setTimeSelectionEnd] = useState(10);
  const [cursorsEnabled, setCursorsEnabled] = useState(false);
  const [currentFftMax, setCurrentFftMax] = useState(-999999);
  const [currentFftMin, setCurrentFftMin] = useState(999999);
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
  const [fftData, setFFTData] = useState<Record<number, Uint8ClampedArray>>({});
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
    window.addEventListener('resize', windowResized);
    if (!pyodide) {
      initPyodide().then((pyodide) => {
        setPyodide(pyodide);
      });
    }
    return () => {
      window.removeEventListener('resize', windowResized);
    };
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
      currentFftMax,
      currentFftMin,
      autoscale,
      zoomLevel,
      iqData,
      {}
    );
    setFFTData(ret?.fftData);
    setFFTImage(ret);
  }, [fftSize, magnitudeMax, magnitudeMin, fftWindow, zoomLevel]);

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
      currentFftMax,
      currentFftMin,
      autoscale,
      zoomLevel,
      iqData,
      fftData
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
    if (autoscale && fftImage.autoMax) {
      console.debug('New max/min:', fftImage.autoMax, fftImage.autoMin);
      setAutoscale(false); // toggles it off so this only will happen once
      setMagnitudeMax(fftImage.autoMax);
      setMagnitudeMin(fftImage.autoMin);
    }
    setCurrentFftMax(fftImage.currentFftMax);
    setCurrentFftMin(fftImage.currentFftMin);
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

  const windowResized = () => {
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
    // Recalc tiles in view
    const { lowerTile, upperTile } = calculateTileNumbers(
      handleTop,
      meta.getTotalSamples(),
      fftSize,
      newSpectrogramHeight,
      zoomLevel
    );
    setLowerTile(lowerTile);
    setUpperTile(upperTile);
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
  }, [meta, zoomLevel, handleTop]);

  // run windowResized once when page loads
  useEffect(() => {
    windowResized();
  }, []);

  const downloadInfo = () => {
    const fileData = JSON.stringify(meta, null, 4);
    const blob = new Blob([fileData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'spectrogram-meta-data-modified.sigmf-meta';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    setTimeout(function () {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 0);
  };

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

  return (
    <SpectrogramContext.Provider
      value={{
        type: type,
        account: account,
        container: container,
        filePath: filePath,
        sasToken: sasToken,
      }}
    >
      {status === 'loading' && <h1>Loading...</h1>}
      <div className="mt-3 mb-0 ml-0 mr-0 p-0">
        <div className="flex flex-row w-full">
          <Sidebar
            updateMagnitudeMax={setMagnitudeMax}
            updateMagnitudeMin={setMagnitudeMin}
            updateFftsize={setFFTSize}
            updateWindowChange={setFFTWindow}
            magnitudeMax={magnitudeMax}
            magnitudeMin={magnitudeMin}
            handleAutoScale={setAutoscale}
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
                      <Layer>
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

                    <Stage width={55} height={spectrogramHeight}>
                      <ScrollBar
                        fetchAndRender={fetchAndRender}
                        spectrogramHeight={spectrogramHeight}
                        downloadedTiles={downloadedTiles}
                        zoomLevel={zoomLevel}
                        handleTop={handleTop}
                        meta={meta}
                        fetchEnabled={fetchMinimap}
                        fftSizeScrollbar={fftSize}
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
              <AnnotationList
                meta={meta}
                setHandleTop={setHandleTop}
                spectrogramHeight={spectrogramHeight}
                setMeta={setMeta}
              />
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
              Metadata
            </summary>
            <div className="outline outline-1 outline-primary p-2">
              <div className="flex flex-row">
                <button
                  className="mb-1 text-right"
                  onClick={() => {
                    downloadInfo();
                  }}
                >
                  <ArrowDownTrayIcon className="inline-block mr-2 h-6 w-6" />
                  Download meta JSON
                </button>
                {/* TODO: Add in when PUT is working <button
              className="text-right ml-1"
              onClick={() => {
                this.handleMeta();
                this.saveMeta();
              }}
            >
              <DocumentCheckIcon className="inline-block mr-2 h-6 w-6" />
              Save latest
            </button>*/}
              </div>
              <div>
                <textarea
                  rows={20}
                  className="textarea w-full bg-base-100 text-base-content overflow-hidden hover:overflow-scroll"
                  readOnly={true}
                  value={JSON.stringify(
                    {
                      global: meta?.global ?? {},
                      captures: meta?.captures ?? [],
                      annotations: meta?.annotations ?? [],
                    },
                    null,
                    4
                  )}
                />
              </div>
            </div>
          </details>
        </div>
      </div>
      <img ref={imgRef} />
      <img ref={imgRef2} />
    </SpectrogramContext.Provider>
  );
};

export default SpectrogramPage;
