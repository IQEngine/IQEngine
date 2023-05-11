// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { Container, Row, Col } from 'react-bootstrap';
import { Sidebar } from './Sidebar';
import { Component } from 'react';
import Button from 'react-bootstrap/Button';
import ScrollBar from './ScrollBar';
import { TimePlot } from './TimePlot';
import { FrequencyPlot } from './FrequencyPlot';
import { IQPlot } from './IQPlot';
import { Layer, Image, Stage } from 'react-konva';
import { selectFft, clearAllData, calculateTileNumbers, range } from '../../Utils/selector';
import { AnnotationViewer } from './AnnotationViewer';
import { RulerTop } from './RulerTop';
import { RulerSide } from './RulerSide';
import { TILE_SIZE_IN_IQ_SAMPLES, MAX_SIMULTANEOUS_FETCHES } from '../../Utils/constants';
import DownloadIcon from '@mui/icons-material/Download';
import TimeSelector from './TimeSelector';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { Navigate } from 'react-router-dom';

async function initPyodide() {
  const pyodide = await window.loadPyodide();
  await pyodide.loadPackage('numpy');
  await pyodide.loadPackage('matplotlib');
  return pyodide;
}

class SpectrogramPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      connection: props.connection,
      blob: props.blob,
      meta: props.meta,
      fftSize: 1024,
      magnitudeMax: 240,
      magnitudeMin: 80,
      window: 'hamming',
      autoscale: false,
      image: null,
      annotations: [], // annotations that are on the screen at that moment (likely a subset of the total annotations)
      sampleRate: 1,
      dataType: '',
      upperTile: -1,
      lowerTile: -1,
      currentSamples: [],
      minimapFetch: false,
      minimapNumFetches: null,
      rulerSideWidth: 50,
      rulerTopHeight: 30,
      marginTop: 30,
      skipNFfts: null,
      spectrogramHeight: 800,
      spectrogramWidth: 600,
      timeSelectionStart: 0, // in units of tiles
      timeSelectionEnd: 10, // in units of tiles
      cursorsEnabled: false,
      currentFftMax: -999999,
      currentFftMin: 999999,
      currentTab: 'spectrogram',
      redirect: false,
      pyodide: null,
      handleTop: 0,
      zoomLevel: 1,
      downloadedTiles: [], // used by minimap
      includeRfFreq: false,
    };
  }

  windowResized = () => {
    const { rulerTopHeight, marginTop, blob, fftSize, handleTop, zoomLevel } = this.state;

    // Calc the area to be filled by the spectrogram
    const windowHeight = window.innerHeight;
    const topRowHeight = document.getElementById('topRow').offsetHeight;
    const tabsHeight = document.getElementById('tabs-tab-spectrogram').offsetHeight;
    const newSpectrogramHeight = windowHeight - topRowHeight - marginTop - tabsHeight - rulerTopHeight - 30;

    // Recalc tiles in view
    const { lowerTile, upperTile } = calculateTileNumbers(
      handleTop,
      blob.totalIQSamples,
      fftSize,
      newSpectrogramHeight,
      zoomLevel
    );

    this.setState({ spectrogramHeight: newSpectrogramHeight, lowerTile: lowerTile, upperTile: upperTile });

    // Trigger re-render, but not when the window first loads
    if (window.iqData) {
      this.renderImage(lowerTile, upperTile);
    }
  };

  // This all just happens once when the spectrogram page opens for the first time (or when you make a change in the code)
  async componentDidMount() {
    let { fetchMetaDataBlob, connection } = this.props;

    // If someone goes to a spectrogram page directly none of the state will be set so redirect to home
    if (!connection.accountName && !connection.datafilehandle) this.setState({ redirect: true });

    // Ability to resize spectrogram when window size is changed
    window.addEventListener('resize', this.windowResized);
    this.windowResized(); // also call it once at the start

    clearAllData(); // clears iqData, fftData, local annotations

    fetchMetaDataBlob(connection); // fetch the metadata

    if (this.state.pyodide === null) {
      const pyodide = await initPyodide();
      this.setState({ pyodide: pyodide });
    }
  }

  componentWillUnmount() {
    // make sure not to resetConnection() here or else it screws up ability to switch between recordings without clicking the browse button again
    this.props.resetMeta();
    window.iqData = {};
    //this.props.resetBlob();  // cant reset this either or when you make code changes with the live server it will screw up after each change
    window.removeEventListener('resize', this.windowResized);
  }

  componentDidUpdate(prevProps, prevState) {
    let newState = prevState;
    let reload = false;
    const props = this.props;
    if (JSON.stringify(this.props.meta) !== JSON.stringify(prevProps.meta)) {
      newState.meta = props.meta;
      const dataType = newState.meta.global['core:datatype'];
      if (!dataType) {
        console.log('WARNING: Incorrect data type');
      }
      newState.dataType = dataType;
      reload = true;
    }
    if (JSON.stringify(props.connection) !== JSON.stringify(prevProps.connection)) {
      newState.connection = props.connection;
    }
    // Each time a fetch finishes we increment blob.size, which causes this block to run and trigger a render
    if (props.blob.size !== prevProps.blob.size) {
      newState.blob.size = props.blob.size;
      let { lowerTile, upperTile } = newState;
      this.renderImage(lowerTile, upperTile);
    }
    if (props.blob.totalIQSamples !== prevProps.blob.totalIQSamples) {
      newState.blob.totalIQSamples = props.blob.totalIQSamples;
    }
    if (props.blob.numActiveFetches !== prevProps.blob.numActiveFetches) {
      newState.blob.numActiveFetches = props.blob.numActiveFetches;
    }
    if (props.blob.status !== prevProps.blob.status) {
      newState.blob.status = props.blob.status;
    }
    if (props.blob.taps !== prevProps.blob.taps) {
      newState.blob.taps = props.blob.taps;

      // force a reload of the screen
      reload = true;
      window.iqData = {};
      window.fftData = {};
    }
    if (props.blob.pythonSnippet !== prevProps.blob.pythonSnippet) {
      newState.blob.pythonSnippet = props.blob.pythonSnippet;

      // force a reload of the screen
      reload = true;
      window.iqData = {};
      window.fftData = {};
    }

    // This kicks things off when you first load into the page
    if (newState.connection.blobClient != null && reload) {
      const { blob, fftSize, spectrogramHeight, zoomLevel } = newState;

      // this tells us its the first time the page has loaded, so start at the beginning of the file (y=0)
      if (
        newState.lowerTile === -1 ||
        newState.upperTile === -1 ||
        isNaN(newState.lowerTile) ||
        isNaN(newState.upperTile)
      ) {
        const { lowerTile, upperTile } = calculateTileNumbers(
          0,
          blob.totalIQSamples,
          fftSize,
          spectrogramHeight,
          zoomLevel
        );
        newState.lowerTile = lowerTile;
        newState.upperTile = upperTile;
      }

      const tiles = range(Math.floor(newState.lowerTile), Math.ceil(newState.upperTile));
      for (let tile of tiles) {
        if (tile.toString() in window.iqData) {
          continue;
        }
        props.fetchMoreData({
          blob: newState.blob,
          dataType: newState.dataType,
          connection: newState.connection,
          tile: tile,
          offset: tile * TILE_SIZE_IN_IQ_SAMPLES, // in IQ samples
          count: TILE_SIZE_IN_IQ_SAMPLES, // in IQ samples
          pyodide: newState.pyodide,
        });
      }
      this.renderImage(newState.lowerTile, newState.upperTile);
    }

    // Fetch the data we need for the minimap image, but only once we have metadata, and only do it once
    if (!newState.minimapFetch && newState.dataType) {
      const fftSizeScrollbar = 1024; // for minimap only. there's so much overhead with blob downloading that this might as well be a high value...
      const skipNFfts = Math.floor(newState.blob.totalIQSamples / 100e3); // sets the decimation rate (manually tweaked)
      newState.skipNFfts = skipNFfts; // so that the scrollbar knows how to place the ticks
      console.log('skipNFfts:', skipNFfts);
      const numFfts = Math.floor(newState.blob.totalIQSamples / fftSizeScrollbar / (skipNFfts + 1));
      for (let i = 0; i < numFfts; i++) {
        props.fetchMinimap({
          blob: newState.blob,
          dataType: newState.dataType,
          connection: newState.connection,
          tile: 'minimap' + i.toString(),
          offset: i * fftSizeScrollbar * (skipNFfts + 1), // in IQ samples
          count: fftSizeScrollbar, // in IQ samples
        });
      }
      newState.minimapFetch = true;
      newState.minimapNumFetches = numFfts;
    }
    return { ...newState };
  }

  handleFftSize = (size) => {
    window.fftData = {};
    // need to do it this way because setState is async
    this.setState(
      {
        fftSize: size,
      },
      () => {
        this.renderImage(this.state.lowerTile, this.state.upperTile);
      }
    );
  };

  toggleCursors = (e) => {
    this.setState({
      cursorsEnabled: e.target.checked,
    });
  };

  toggleIncludeRfFreq = (e) => {
    this.setState({
      includeRfFreq: e.target.checked,
    });
  };

  handleTimeSelectionStart = (start) => {
    this.setState({
      timeSelectionStart: start,
    });
  };

  handleTimeSelectionEnd = (end) => {
    this.setState({
      timeSelectionEnd: end,
    });
  };

  handleProcessTime = () => {
    const { timeSelectionStart, timeSelectionEnd } = this.state; // these 2 are in units of tile (incl fraction of a tile)

    // Concatenate and trim the IQ Data associated with this range of samples
    const tiles = range(Math.floor(timeSelectionStart), Math.ceil(timeSelectionEnd)); //non-inclusive of end, e.g. if it ends with tile 7.2 we only want tile 7 not 8
    let bufferLen = tiles.length * TILE_SIZE_IN_IQ_SAMPLES * 2; // number of floats

    let currentSamples = new Float32Array(bufferLen);
    let counter = 0;
    for (let tile of tiles) {
      if (tile.toString() in window.iqData) {
        currentSamples.set(window.iqData[tile.toString()], counter);
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
    this.setState({ currentSamples: trimmedSamples });

    const startSampleOffset = timeSelectionStart * TILE_SIZE_IN_IQ_SAMPLES; // in IQ samples
    return { trimmedSamples: trimmedSamples, startSampleOffset: startSampleOffset }; // only used by detector
  };

  handleWindowChange = (x) => {
    window.fftData = {};
    // need to do it this way because setState is async
    this.setState(
      {
        window: x,
      },
      () => {
        this.renderImage(this.state.lowerTile, this.state.upperTile);
      }
    );
  };

  handleMagnitudeMin = (min) => {
    window.fftData = {};
    // need to do it this way because setState is async
    this.setState(
      {
        magnitudeMin: min,
      },
      () => {
        this.renderImage(this.state.lowerTile, this.state.upperTile);
      }
    );
  };

  handleMagnitudeMax = (max) => {
    window.fftData = {};
    // need to do it this way because setState is async
    this.setState(
      {
        magnitudeMax: max,
      },
      () => {
        this.renderImage(this.state.lowerTile, this.state.upperTile);
      }
    );
  };

  handleZoomLevel = (newLevel) => {
    this.setState({ zoomLevel: newLevel }, () => {
      this.fetchAndRender(this.state.handleTop);
    });
  };

  handleAutoScale = () => {
    this.setState({
      autoscale: true,
    });
  };

  handleMeta = (annotations) => {
    this.setState(
      {
        meta: {
          ...this.state.meta,
          annotations: annotations,
        },
      },
      () => {
        this.renderImage(this.state.lowerTile, this.state.upperTile);
      }
    );
  };

  handleMetaGlobal = (newMetaGlobal) => {
    this.setState({
      meta: {
        ...this.state.meta,
        global: newMetaGlobal,
      },
    });
  };

  downloadInfo() {
    const fileData = JSON.stringify(this.state.meta, null, 4);
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
  }

  handleMetaChange = (e) => {
    const newMeta = JSON.parse(e.target.value);
    // update meta
    this.setState(
      {
        meta: {
          annotations: newMeta.annotations,
          captures: newMeta.captures,
          global: newMeta.global,
        },
      },
      () => {
        this.renderImage(this.state.lowerTile, this.state.upperTile);
      }
    );
  };

  renderImage = (lowerTile, upperTile) => {
    const { fftSize, magnitudeMax, magnitudeMin, meta, autoscale, currentFftMax, currentFftMin, zoomLevel } =
      this.state;

    // Update the image (eventually this should get moved somewhere else)
    let ret = selectFft(
      lowerTile,
      upperTile,
      fftSize,
      magnitudeMax,
      magnitudeMin,
      meta,
      this.state.window, // dont want to conflict with the main window var
      currentFftMax,
      currentFftMin,
      autoscale,
      zoomLevel
    );
    if (ret) {
      // Draw the spectrogram
      createImageBitmap(ret.imageData).then((ret) => {
        this.setState({ image: ret });
        //console.log('Image Updated');
      });
      if (autoscale && ret.autoMax) {
        console.log('New max/min:', ret.autoMax, ret.autoMin);
        window.fftData = {};
        this.setState(
          {
            autoscale: false, // toggles it off so this only will happen once
            magnitudeMax: ret.autoMax,
            magnitudeMin: ret.autoMin,
          },
          () => {
            this.renderImage(lowerTile, upperTile);
          }
        );
      }
      this.setState({ annotations: ret.annotations });
      this.setState({ sampleRate: ret.sampleRate });
      this.setState({ currentFftMax: ret.currentFftMax });
      this.setState({ currentFftMin: ret.currentFftMin });
    }
  };

  // num is the y pixel coords of the top of the scrollbar handle, so range of 0 to the height of the scrollbar minus height of handle
  fetchAndRender = (handleTop) => {
    const { blob, connection, dataType, fftSize, pyodide, spectrogramHeight, zoomLevel } = this.state;
    const { upperTile, lowerTile } = calculateTileNumbers(
      handleTop,
      blob.totalIQSamples,
      fftSize,
      spectrogramHeight,
      zoomLevel
    );
    this.setState({ lowerTile: lowerTile, upperTile: upperTile, handleTop: handleTop });

    // If we already have too many pending fetches then bail
    if (blob.numActiveFetches > MAX_SIMULTANEOUS_FETCHES) {
      console.log('Hit limit of simultaneous fetches!');
      return false;
    }

    // Update list of which tiles have been downloaded which minimap displays
    let downloadedTiles = Object.keys(window.iqData);

    // Fetch the tiles
    const tiles = range(Math.floor(lowerTile), Math.ceil(upperTile));
    for (let tile of tiles) {
      if (!(tile.toString() in window.iqData)) {
        downloadedTiles.push(tile.toString());
        this.props.fetchMoreData({
          tile: tile,
          connection: connection,
          blob: blob,
          dataType: dataType,
          offset: tile * TILE_SIZE_IN_IQ_SAMPLES, // in IQ samples
          count: TILE_SIZE_IN_IQ_SAMPLES, // in IQ samples
          pyodide: pyodide,
        });
      }
    }

    downloadedTiles = downloadedTiles.filter((e) => !e.includes('minimap')); // remove minimap ones
    this.setState({ downloadedTiles: downloadedTiles });

    this.renderImage(lowerTile, upperTile);
    return true;
  };

  render() {
    const {
      blob,
      meta,
      fftSize,
      magnitudeMax,
      magnitudeMin,
      image,
      annotations,
      sampleRate,
      lowerTile,
      currentSamples,
      minimapNumFetches,
      rulerSideWidth,
      skipNFfts,
      spectrogramHeight,
      spectrogramWidth,
      upperTile,
      cursorsEnabled,
      currentTab,
      redirect,
      rulerTopHeight,
      marginTop,
      downloadedTiles,
      zoomLevel,
      includeRfFreq,
    } = this.state;

    const fft = {
      size: fftSize,
      magnitudeMax: magnitudeMax,
      magnitudeMin: magnitudeMin,
    };

    if (redirect) {
      window.removeEventListener('resize', this.windowResized);
      return <Navigate to="/" />;
    }

    return (
      <div style={{ marginTop: marginTop }}>
        <Container>
          <Row id="mainRow" className="flex-nowrap">
            <Col className="col-3">
              <Sidebar
                updateBlobTaps={this.props.updateBlobTaps}
                updateMagnitudeMax={this.handleMagnitudeMax}
                updateMagnitudeMin={this.handleMagnitudeMin}
                updateFftsize={this.handleFftSize}
                updateWindowChange={this.handleWindowChange}
                fft={fft}
                blob={blob}
                meta={meta}
                handleAutoScale={this.handleAutoScale}
                handleMetaGlobal={this.handleMetaGlobal}
                handleMeta={this.handleMeta}
                cursorsEnabled={cursorsEnabled}
                handleProcessTime={this.handleProcessTime}
                toggleCursors={this.toggleCursors}
                toggleIncludeRfFreq={this.toggleIncludeRfFreq}
                updatePythonSnippet={this.props.updateBlobPythonSnippet}
                updateZoomLevel={this.handleZoomLevel}
              />
            </Col>
            <Col>
              <Tabs
                id="tabs"
                activeKey={currentTab}
                onSelect={(k) => {
                  this.handleProcessTime();
                  this.setState({ currentTab: k });
                }}
              >
                <Tab eventKey="spectrogram" title="Spectrogram">
                  <Row style={{ marginLeft: 0, marginRight: 0 }}>
                    <Col>
                      <Stage width={spectrogramWidth + 110} height={rulerTopHeight}>
                        <RulerTop
                          fftSize={fftSize}
                          sampleRate={sampleRate}
                          spectrogramWidth={spectrogramWidth}
                          fft={fft}
                          meta={meta}
                          blob={blob}
                          spectrogramWidthScale={spectrogramWidth / fftSize}
                          includeRfFreq={includeRfFreq}
                        />
                      </Stage>
                    </Col>
                  </Row>
                  <Row style={{ marginLeft: 0, marginRight: 0 }}>
                    <Col>
                      <Stage width={spectrogramWidth} height={spectrogramHeight}>
                        <Layer>
                          <Image image={image} x={0} y={0} width={spectrogramWidth} height={spectrogramHeight} />
                        </Layer>
                        <AnnotationViewer
                          handleMeta={this.handleMeta}
                          annotations={annotations}
                          spectrogramWidthScale={spectrogramWidth / fftSize}
                          meta={meta}
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
                            handleTimeSelectionStart={this.handleTimeSelectionStart}
                            handleTimeSelectionEnd={this.handleTimeSelectionEnd}
                          />
                        )}
                      </Stage>
                    </Col>
                    <Col className="col-1" style={{ paddingTop: 0, paddingLeft: 0, paddingRight: 0 }}>
                      <Stage width={rulerSideWidth} height={spectrogramHeight}>
                        <RulerSide
                          spectrogramWidth={spectrogramWidth}
                          fftSize={fftSize}
                          sampleRate={sampleRate}
                          currentRowAtTop={(lowerTile * TILE_SIZE_IN_IQ_SAMPLES) / fftSize}
                          spectrogramHeight={spectrogramHeight}
                        />
                      </Stage>
                    </Col>
                    <Col style={{ justifyContent: 'left', paddingTop: 0, paddingLeft: 0, paddingRight: 0 }}>
                      <Stage width={55} height={spectrogramHeight}>
                        <ScrollBar
                          fetchAndRender={this.fetchAndRender}
                          totalIQSamples={blob.totalIQSamples}
                          spectrogramHeight={spectrogramHeight}
                          fftSize={fftSize}
                          minimapNumFetches={minimapNumFetches}
                          meta={meta}
                          skipNFfts={skipNFfts}
                          size={this.props.minimap.size}
                          downloadedTiles={downloadedTiles}
                          zoomLevel={zoomLevel}
                        />
                      </Stage>
                    </Col>
                  </Row>
                </Tab>
                <Tab eventKey="time" title="Time Plot">
                  {/* Reduces lag by only rendering the time/freq/iq components when they are selected */}
                  {currentTab === 'time' && (
                    <TimePlot currentSamples={currentSamples} cursorsEnabled={cursorsEnabled} />
                  )}
                </Tab>
                <Tab eventKey="frequency" title="Frequency Plot">
                  {currentTab === 'frequency' && (
                    <FrequencyPlot currentSamples={currentSamples} cursorsEnabled={cursorsEnabled} />
                  )}
                </Tab>
                <Tab eventKey="iq" title="IQ Plot">
                  {currentTab === 'iq' && <IQPlot currentSamples={currentSamples} cursorsEnabled={cursorsEnabled} />}
                </Tab>
              </Tabs>
            </Col>
          </Row>
          <Row style={{ paddingBottom: '5px', paddingTop: '30px' }}>
            <Col className="col-3">
              <Button
                className="text-right"
                variant="secondary"
                onClick={() => {
                  this.handleMeta();
                  this.downloadInfo();
                }}
              >
                <DownloadIcon></DownloadIcon>
                Download meta JSON
              </Button>
            </Col>
            <Col></Col>
          </Row>
          <Row>
            <textarea
              rows="20"
              cols="100"
              onChange={this.handleMetaChange}
              value={JSON.stringify(this.state.meta, null, 4)}
            />
          </Row>
        </Container>
      </div>
    );
  }
}

export default SpectrogramPage;
