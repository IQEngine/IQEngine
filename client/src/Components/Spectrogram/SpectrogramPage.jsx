// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { Sidebar } from './Sidebar';
import { useEffect } from 'react';
import ScrollBar from './ScrollBar';
import { TimePlot } from './TimePlot';
import { FrequencyPlot } from './FrequencyPlot';
import { IQPlot } from './IQPlot';
import { Layer, Image, Stage } from 'react-konva';
import { selectFft, calculateTileNumbers, range } from '../../Utils/selector';
import { AnnotationViewer } from '@/Components/Annotation/AnnotationViewer';
import { RulerTop } from './RulerTop';
import { RulerSide } from './RulerSide';
import { TILE_SIZE_IN_IQ_SAMPLES, MAX_SIMULTANEOUS_FETCHES } from '../../Utils/constants';
import TimeSelector from './TimeSelector';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import AnnotationList from '@/Components/Annotation/AnnotationList';
import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/Store/hooks';
import { resetMetaObj, setMetaAnnotations, setMetaGlobal, fetchMeta } from '@/Store/Reducers/FetchMetaReducer';
import { resetBlobFFTData } from '@/Store/Reducers/BlobReducer';
import { fetchMoreData, resetBlobObject, updateBlobSampleRate } from '@/Store/Reducers/BlobReducer';
import { fetchMinimap } from '@/Store/Reducers/MinimapReducer';

async function initPyodide() {
  const pyodide = await window.loadPyodide();
  await pyodide.loadPackage('numpy');
  await pyodide.loadPackage('matplotlib');
  return pyodide;
}

export const SpectrogramPage = (props) => {
  const rulerSideWidth = 50;
  const rulerTopHeight = 30;
  const marginTop = 30;

  const [fftSize, setFFTSize] = useState(1024);
  const [magnitudeMax, setMagnitudeMax] = useState(240);
  const [magnitudeMin, setMagnitudeMin] = useState(80);
  const [fftWindow, setFFTWindow] = useState('hamming');
  const [autoscale, setAutoscale] = useState(false);
  const [image, setImage] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [upperTile, setUpperTile] = useState(-1);
  const [lowerTile, setLowerTile] = useState(-1);
  const [currentSamples, setCurrentSamples] = useState([]);
  const [minimapFetch, setMinimapFetch] = useState(true);
  const [minimapNumFetches, setMinimapNumFetches] = useState(null);
  const [skipNFfts, setSkipNFfts] = useState(null);
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
  const [downloadedTiles, setDownloadedTiles] = useState([]);
  const [includeRfFreq, setIncludeRfFreq] = useState(false);
  const [plotWidth, setPlotWidth] = useState(0);
  const [plotHeight, setPlotHeight] = useState(0);

  const dispatch = useAppDispatch();
  const connection = useAppSelector((state) => state.connection);
  const blob = useAppSelector((state) => state.blob);
  const meta = useAppSelector((state) => state.meta);

  const renderImage = () => {
    if (lowerTile < 0 || upperTile < 0) {
      return;
    }
    // Update the image (eventually this should get moved somewhere else)
    let ret = selectFft(
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
      zoomLevel
    );
    if (ret) {
      // Draw the spectrogram
      createImageBitmap(ret.imageData).then((ret) => {
        setImage(ret);
      });
      if (autoscale && ret.autoMax) {
        console.log('New max/min:', ret.autoMax, ret.autoMin);
        setAutoscale(false); // toggles it off so this only will happen once
        setMagnitudeMax(ret.autoMax);
        setMagnitudeMin(ret.autoMin);
      }
      setAnnotations(ret.annotations);
      setCurrentFftMax(ret.currentFftMax);
      setCurrentFftMin(ret.currentFftMin);
    }
  };

  const fetchAndRender = (handleTop) => {
    console.log(`Fetching and rendering with handleTop ${handleTop} and meta ${JSON.stringify(meta)}`);
    if (!meta || Object.keys(meta.global).length === 0 || !connection || !meta.global['core:datatype']) {
      console.log('No meta or connection! skipping fetch');
      return;
    }
    const calculatedTiles = calculateTileNumbers(handleTop, blob.totalIQSamples, fftSize, spectrogramHeight, zoomLevel);

    // If we already have too many pending fetches then bail
    if (blob.numActiveFetches > MAX_SIMULTANEOUS_FETCHES) {
      console.log('Hit limit of simultaneous fetches!');
      return false;
    }

    // Update list of which tiles have been downloaded which minimap displays
    let downloadedTiles = Object.keys(blob.iqData);

    // Fetch the tiles
    const tiles = range(Math.floor(calculatedTiles.lowerTile), Math.ceil(calculatedTiles.upperTile));
    for (let tile of tiles) {
      if (blob.iqData[tile.toString()] === undefined) {
        downloadedTiles.push(tile.toString());
        dispatch(
          fetchMoreData({
            tile: tile,
            connection: connection,
            blob: blob,
            dataType: meta.global['core:datatype'],
            offset: tile * TILE_SIZE_IN_IQ_SAMPLES, // in IQ samples
            count: TILE_SIZE_IN_IQ_SAMPLES, // in IQ samples
            pyodide: pyodide,
          })
        );
      }
    }
    setDownloadedTiles(downloadedTiles);
    setUpperTile(calculatedTiles.upperTile);
    setLowerTile(calculatedTiles.lowerTile);
    setHandleTop(handleTop);
    renderImage();
    return true;
  };

  const windowResized = () => {
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
      blob.totalIQSamples,
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

    // Trigger re-render, but not when the window first loads
    if (blob.iqData) {
      renderImage(lowerTile, upperTile);
    }
  };

  useEffect(() => {
    if (meta) {
      renderImage(lowerTile, upperTile);
    }
  }, [zoomLevel, autoscale, blob.iqData, lowerTile, upperTile]);

  useEffect(() => {
    if (meta) {
      dispatch(resetBlobFFTData());
      renderImage(lowerTile, upperTile);
    }
  }, [magnitudeMax, magnitudeMin, fftSize, fftWindow]);

  // Refetch IQ and rerender
  useEffect(() => {
    fetchAndRender(handleTop);
  }, [blob.taps, plotHeight, zoomLevel, blob.pythonSnippet]);

  useEffect(() => {
    if (meta && meta.global && !meta.global['core:sample_rate']) {
      console.log('WARNING: Incorrect sample rate');
    } else {
      dispatch(updateBlobSampleRate(meta.global['core:sample_rate']));
    }
    fetchAndRender(handleTop);
  }, [meta]);

  useEffect(() => {
    if (!meta) return;
    let currenlowerTile = lowerTile;
    let currentUpperTile = upperTile;
    if (currenlowerTile < 0 || currentUpperTile < 0 || isNaN(currenlowerTile) || isNaN(currentUpperTile)) {
      const calculated = calculateTileNumbers(0, blob.totalIQSamples, fftSize, spectrogramHeight, zoomLevel);
      currenlowerTile = calculated.lowerTile;
      currentUpperTile = calculated.upperTile;
    }
    const tiles = range(Math.floor(currenlowerTile), Math.ceil(currentUpperTile));
    for (let tile of tiles) {
      if (blob.iqData[tile] !== undefined) {
        dispatch(
          fetchMoreData({
            blob: blob,
            dataType: meta.global['core:datatype'],
            connection: connection,
            tile: tile,
            offset: tile * TILE_SIZE_IN_IQ_SAMPLES, // in IQ samples
            count: TILE_SIZE_IN_IQ_SAMPLES, // in IQ samples
            pyodide: pyodide,
          })
        );
        continue;
      }
    }
    setLowerTile(currenlowerTile);
    setUpperTile(currentUpperTile);
  }, [meta]);

  useEffect(() => {
    if (!meta || !meta.global || !meta.global['core:datatype'] || !minimapFetch) {
      return;
    }
    windowResized();
    const fftSizeScrollbar = 1024; // for minimap only. there's so much overhead with blob downloading that this might as well be a high value...
    const skipNFfts = Math.floor(blob.totalIQSamples / 100e3); // sets the decimation rate (manually tweaked)
    setSkipNFfts(skipNFfts);
    console.log('skipNFfts:', skipNFfts);
    const numFfts = Math.floor(blob.totalIQSamples / fftSizeScrollbar / (skipNFfts + 1));
    for (let i = 0; i < numFfts; i++) {
      dispatch(
        fetchMinimap({
          blob: blob,
          dataType: meta.global['core:datatype'],
          connection: connection,
          tile: 'minimap' + i.toString(),
          offset: i * fftSizeScrollbar * (skipNFfts + 1), // in IQ samples
          count: fftSizeScrollbar, // in IQ samples
        })
      );
    }
    setMinimapFetch(false);
    setMinimapNumFetches(numFfts);
  }, [meta]);

  useEffect(() => {
    window.addEventListener('resize', windowResized);
    if (!pyodide) {
      initPyodide().then((pyodide) => {
        setPyodide(pyodide);
      });
    }
    fetchAndRender(handleTop);
    return () => {
      window.removeEventListener('resize', windowResized);
      dispatch(resetMetaObj());
      dispatch(resetBlobObject()); // is this needed?
    };
  }, []);

  useEffect(() => {
    if (connection) {
      dispatch(fetchMeta(connection));
    }
  }, [connection]);

  const updateSpectrogram = (startSampleCount) => {
    if (startSampleCount) {
      const fractionIntoFile = startSampleCount / blob.totalIQSamples;
      const handleTop = fractionIntoFile * spectrogramHeight;
      fetchAndRender(handleTop);
    } else {
      fetchAndRender(handleTop);
    }
  };

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

  const handleMetaGlobal = (newMetaGlobal) => {
    dispatch(setMetaGlobal(newMetaGlobal));
  };

  const handleMetaAnnotation = (newMetaAnnotation) => {
    dispatch(setMetaAnnotations(newMetaAnnotation));
  };

  const toggleIncludeRfFreq = () => {
    setIncludeRfFreq(!includeRfFreq);
  };

  const handleProcessTime = () => {
    // these 2 are in units of tile (incl fraction of a tile)
    // Concatenate and trim the IQ Data associated with this range of samples
    const tiles = range(Math.floor(timeSelectionStart), Math.ceil(timeSelectionEnd)); //non-inclusive of end, e.g. if it ends with tile 7.2 we only want tile 7 not 8
    let bufferLen = tiles?.length * TILE_SIZE_IN_IQ_SAMPLES * 2; // number of floats

    let currentSamples = new Float32Array(bufferLen);
    let counter = 0;
    for (let tile of tiles) {
      if (blob.iqData[tile.toString()] !== undefined) {
        currentSamples.set(blob.iqData[tile.toString()], counter);
      } else {
        console.log('Dont have iqData of tile', tile, 'yet');
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
    return { trimmedSamples: trimmedSamples, startSampleOffset: startSampleOffset }; // only used by detector
  };

  return (
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
        />
        <div className="flex flex-col">
          <ul className="flex space-x-2 border-b border-iqengine-primary w-full sm:pl-12 lg:pl-32" id="tabsbar">
            <li>
              <button
                onClick={() => {
                  handleProcessTime();
                  setCurrentTab('spectrogram');
                }}
                className={` ${
                  currentTab === 'spectrogram' ? 'bg-iqengine-primary !text-black' : ''
                } inline-block px-3 py-0 outline  outline-iqengine-primary outline-1 text-lg text-iqengine-primary hover:text-green-900`}
              >
                Spectrogram
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  handleProcessTime();
                  setCurrentTab('time');
                }}
                className={` ${
                  currentTab === 'time' ? 'bg-iqengine-primary !text-black' : ''
                } inline-block px-3 py-0 outline outline-iqengine-primary outline-1 text-lg text-iqengine-primary hover:text-green-900`}
              >
                Time
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  handleProcessTime();
                  setCurrentTab('frequency');
                }}
                className={` ${
                  currentTab === 'frequency' ? 'bg-iqengine-primary !text-black' : ''
                } inline-block px-3 py-0 outline  outline-iqengine-primary outline-1 text-lg text-iqengine-primary hover:text-green-900`}
              >
                Frequency
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  handleProcessTime();
                  setCurrentTab('iq');
                }}
                className={` ${
                  currentTab === 'iq' ? 'bg-iqengine-primary !text-black' : ''
                } inline-block px-3 py-0 outline  outline-iqengine-primary outline-1 text-lg text-iqengine-primary hover:text-green-900`}
              >
                IQ Plot
              </button>
            </li>
          </ul>
          <div className="p-0 ml-0 mr-0 mb-0 mt-2">
            <div className={currentTab === 'spectrogram' ? 'block' : 'hidden'}>
              <div className="flex flex-col pl-3">
                <Stage width={spectrogramWidth + 110} height={rulerTopHeight}>
                  <RulerTop
                    sampleRate={blob.sampleRate}
                    spectrogramWidth={spectrogramWidth}
                    spectrogramWidthScale={spectrogramWidth / fftSize}
                    includeRfFreq={includeRfFreq}
                  />
                </Stage>

                <div className="flex flex-row">
                  <Stage width={spectrogramWidth} height={spectrogramHeight}>
                    <Layer>
                      <Image image={image} x={0} y={0} width={spectrogramWidth} height={spectrogramHeight} />
                    </Layer>
                    <AnnotationViewer
                      annotations={annotations}
                      spectrogramWidthScale={spectrogramWidth / fftSize}
                      fftSize={fftSize}
                      lowerTile={lowerTile}
                      zoomLevel={zoomLevel}
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
                      sampleRate={blob.sampleRate}
                      currentRowAtTop={(lowerTile * TILE_SIZE_IN_IQ_SAMPLES) / fftSize}
                      spectrogramHeight={spectrogramHeight}
                    />
                  </Stage>

                  <Stage width={55} height={spectrogramHeight}>
                    <ScrollBar
                      fetchAndRender={fetchAndRender}
                      spectrogramHeight={spectrogramHeight}
                      fftSize={fftSize}
                      minimapNumFetches={minimapNumFetches}
                      skipNFfts={skipNFfts}
                      downloadedTiles={downloadedTiles}
                      zoomLevel={zoomLevel}
                      handleTop={handleTop}
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
        </div>
      </div>

      <div className="mt-3 mb-0 px-2 py-0" style={{ margin: '5px' }}>
        <details>
          <summary className="pl-2 mt-2 bg-iqengine-primary outline outline-1 outline-iqengine-primary text-lg text-black hover:bg-green-800">
            Annotations
          </summary>
          <div className="outline outline-1 outline-iqengine-primary p-2">
            <AnnotationList updateSpectrogram={updateSpectrogram} />
          </div>
        </details>

        <details>
          <summary className="pl-2 mt-2 bg-iqengine-primary outline outline-1 outline-iqengine-primary text-lg text-black hover:bg-green-800">
            Metadata
          </summary>
          <div className="outline outline-1 outline-iqengine-primary p-2">
            <div className="flex flex-row">
              <button
                className="btn btn-primary text-right"
                onClick={() => {
                  downloadInfo();
                }}
              >
                <ArrowDownTrayIcon className="inline-block mr-2 h-6 w-6" />
                Download meta JSON
              </button>
              {/* TODO: Add in when PUT is working <button
              className="btn btn-primary text-right ml-1"
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
                rows="20"
                className="bg-neutral text-base-100"
                style={{ width: '100%' }}
                onChange={handleMetaAnnotation}
                value={JSON.stringify(meta, null, 4)}
              />
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default SpectrogramPage;
