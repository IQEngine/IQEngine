// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Container, Row, Col } from 'react-bootstrap';
import { Sidebar } from './Sidebar';
import { Component } from 'react';
import Toggle from 'react-toggle';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ScrollBar from './ScrollBar';
import { TimePlot } from './TimePlot';
import { Layer, Image, Stage } from 'react-konva';
import { select_fft, clear_all_data, calculateTileNumbers, range } from '../../Utils/selector';
import { AnnotationViewer } from './AnnotationViewer';
import { RulerTop } from './RulerTop';
import { RulerSide } from './RulerSide';
import { TILE_SIZE_IN_BYTES } from '../../Utils/constants';
import DownloadIcon from '@mui/icons-material/Download';
import TimeSelector from './TimeSelector';

class SpectrogramPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      connection: props.connection,
      blob: props.blob,
      meta: props.meta,
      fftSize: 1024,
      magnitudeMax: 240,
      magnitudeMin: 100,
      window: 'hamming',
      autoscale: false,
      image: null,
      annotations: [],
      sampleRate: 1,
      stageRef: null,
      bytesPerSample: null,
      data_type: '',
      upperTile: -1,
      lowerTile: -1,
      currentSamples: [],
      minimapFetch: false,
      minimapNumFetches: null,
      rulerSideWidth: 50,
      skipNFfts: null,
      spectrogramHeight: 600,
      spectrogramWidth: 600,
      timeSelectionStart: -1,
      timeSelectionEnd: -1,
      openModal: false,
      cursorsEnabled: false,
      currentFftMax: -999999,
      currentFftMin: 999999,
    };
  }

  // This all just happens once when the spectrogram page opens for the first time
  componentDidMount() {
    let { fetchMetaDataBlob, connection } = this.props;
    window.iq_data = {};
    clear_all_data();
    fetchMetaDataBlob(connection); // fetch the metadata
  }

  componentWillUnmount() {
    // make sure not to resetConnection() here or else it screws up ability to switch between recordings without clicking the browse button again
    this.props.resetMeta();
    window.iq_data = {};
    this.props.resetBlob();
  }

  componentDidUpdate(prevProps, prevState) {
    let newState = prevState;
    let metaIsSet = false;
    const props = this.props;
    if (JSON.stringify(this.props.meta) !== JSON.stringify(prevProps.meta)) {
      newState.meta = props.meta;
      const data_type = newState.meta.global['core:datatype'];
      if (!data_type) {
        console.log('WARNING: Incorrect data type');
      }
      newState.data_type = data_type;
      if (data_type === 'ci16_le') {
        newState.bytesPerSample = 2;
      } else if (data_type === 'cf32_le') {
        newState.bytesPerSample = 4;
      }
      metaIsSet = true;
    }
    if (JSON.stringify(props.connection) !== JSON.stringify(prevProps.connection)) {
      newState.connection = props.connection;
    }
    if (props.blob.size !== prevProps.blob.size) {
      newState.blob.size = props.blob.size;
      let { lowerTile, upperTile } = newState;
      this.renderImage(lowerTile, upperTile);
    }
    if (props.blob.totalBytes !== prevProps.blob.totalBytes) {
      newState.blob.totalBytes = props.blob.totalBytes;
    }
    if (props.blob.status !== prevProps.blob.status) {
      newState.blob.status = props.blob.status;
    }
    if (props.blob.taps !== prevProps.blob.taps) {
      newState.blob.taps = props.blob.taps;
      this.renderImage(this.state.lowerTile, this.state.upperTile); // need to trigger a rerender here, because the handler is in settingspane
    }

    // This kicks things off when you first load into the page
    if (newState.connection.blobClient != null && metaIsSet) {
      const { bytesPerSample, blob, fftSize } = newState;
      const { lowerTile, upperTile } = calculateTileNumbers(0, bytesPerSample, blob, fftSize);
      const tiles = range(Math.floor(lowerTile), Math.ceil(upperTile));
      newState.lowerTile = lowerTile;
      newState.upperTile = upperTile;
      for (let tile of tiles) {
        if (tile.toString() in window.iq_data) {
          continue;
        }
        props.fetchMoreData({
          blob: newState.blob,
          data_type: newState.data_type,
          connection: newState.connection,
          tile: tile,
          offset: tile * TILE_SIZE_IN_BYTES,
          count: TILE_SIZE_IN_BYTES,
        });
      }
      this.renderImage(lowerTile, upperTile);
    }

    // Fetch the data we need for the minimap image, but only once we have metadata, and only do it once
    if (!newState.minimapFetch && newState.data_type) {
      const fft_size = 1024; // for minimap only. there's so much overhead with blob downloading that this might as well be a high value...
      const skip_N_ffts = Math.floor(newState.blob.totalBytes / 400e3); // sets the decimation rate (manually tweaked)
      newState.skipNFfts = skip_N_ffts; // so that the scrollbar knows how to place the ticks
      console.log('skip_N_ffts:', skip_N_ffts);
      const num_ffts = Math.floor(
        newState.blob.totalBytes / 2 / newState.bytesPerSample / fft_size / (skip_N_ffts + 1)
      );
      for (let i = 0; i < num_ffts; i++) {
        props.fetchMinimap({
          blob: newState.blob,
          data_type: newState.data_type,
          connection: newState.connection,
          tile: 'minimap' + i.toString(),
          offset: i * 2 * newState.bytesPerSample * fft_size * (skip_N_ffts + 1),
          count: fft_size * newState.bytesPerSample * 2,
        });
      }
      newState.minimapFetch = true;
      newState.minimapNumFetches = num_ffts;
    }
    return { ...newState };
  }

  handleFftSize = (size) => {
    window.fft_data = {};
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

  toggleModal = () => {
    this.handleProcessTime();
    this.setState({
      openModal: !this.state.openModal,
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
    const { timeSelectionStart, timeSelectionEnd } = this.state;

    // Concatenate and trim the IQ Data associated with this range of samples
    const tiles = range(Math.floor(timeSelectionStart), Math.ceil(timeSelectionEnd));
    let bufferLen = tiles.length * TILE_SIZE_IN_BYTES;

    let currentSamples;
    if (this.state.data_type === 'ci16_le') {
      currentSamples = new Int16Array(bufferLen / this.state.bytesPerSample);
    } else if (this.state.data_type === 'cf32_le') {
      currentSamples = new Float32Array(bufferLen / this.state.bytesPerSample);
    } else {
      currentSamples = new Float32Array(bufferLen / this.state.bytesPerSample);
    }

    let counter = 0;
    for (let tile of tiles) {
      if (tile.toString() in window.iq_data) {
        currentSamples.set(window.iq_data[tile.toString()], counter);
        counter = counter + TILE_SIZE_IN_BYTES / this.state.bytesPerSample;
      } else {
        console.log('Dont have iq_data of tile', tile, 'yet');
      }
    }

    // Trim off the top and bottom
    let lowerTrim = Math.floor(
      ((timeSelectionStart - Math.floor(timeSelectionStart)) * TILE_SIZE_IN_BYTES) / this.state.bytesPerSample
    ); // samples to get rid of
    if (lowerTrim % 2 === 1) lowerTrim = lowerTrim + 1; // for I to be first in IQ
    let upperTrim = Math.floor(
      ((1 - (timeSelectionEnd - Math.floor(timeSelectionEnd))) * TILE_SIZE_IN_BYTES) / this.state.bytesPerSample
    ); // samples to get rid of
    if (upperTrim % 2 === 1) upperTrim = upperTrim + 1;
    const trimmedSamples = currentSamples.slice(lowerTrim, bufferLen - upperTrim);
    this.setState({ currentSamples: trimmedSamples });

    const startSampleOffset = (timeSelectionStart * TILE_SIZE_IN_BYTES) / this.state.bytesPerSample / 2; // in IQ samples
    return { trimmedSamples: trimmedSamples, startSampleOffset: startSampleOffset }; // only used by detector
  };

  handleWindowChange = (x) => {
    window.fft_data = {};
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
    window.fft_data = {};
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
    window.fft_data = {};
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

  handleAutoScale = () => {
    const { autoscale } = this.state;
    this.setState({
      autoscale: !autoscale,
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
    link.click();
  }

  handleMetaChange = (e) => {
    const new_meta = JSON.parse(e.target.value);
    // update meta
    this.setState(
      {
        meta: {
          annotations: new_meta.annotations,
          captures: new_meta.captures,
          global: new_meta.global,
        },
      },
      () => {
        this.renderImage(this.state.lowerTile, this.state.upperTile);
      }
    );
  };

  renderImage = (lowerTile, upperTile) => {
    const {
      bytesPerSample,
      fftSize,
      magnitudeMax,
      magnitudeMin,
      meta,
      window,
      autoscale,
      currentFftMax,
      currentFftMin,
    } = this.state;
    // Update the image (eventually this should get moved somewhere else)
    let ret = select_fft(
      lowerTile,
      upperTile,
      bytesPerSample,
      fftSize,
      magnitudeMax,
      magnitudeMin,
      meta,
      window,
      currentFftMax,
      currentFftMin,
      autoscale
    );
    if (ret) {
      // Draw the spectrogram
      createImageBitmap(ret.image_data).then((ret) => {
        this.setState({ image: ret });
        //console.log('Image Updated');
      });
      if (autoscale && ret.autoMax) {
        this.handleAutoScale(); // toggles it off so this only will happen once
        this.handleMagnitudeMax(ret.autoMax);
        this.handleMagnitudeMin(ret.autoMin);
      }

      this.setState({ annotations: ret.annotations });
      this.setState({ sampleRate: ret.sample_rate });
      this.setState({ currentFftMax: ret.currentFftMax });
      this.setState({ currentFftMin: ret.currentFftMin });
    }
  };

  // num is the y pixel coords of the top of the scrollbar handle, so range of 0 to the height of the scrollbar minus height of handle
  fetchAndRender = (handleTop) => {
    const { blob, connection, data_type, bytesPerSample, fftSize } = this.state;
    const { upperTile, lowerTile } = calculateTileNumbers(handleTop, bytesPerSample, blob, fftSize);
    this.setState({ lowerTile: lowerTile, upperTile: upperTile });

    const tiles = range(Math.floor(lowerTile), Math.ceil(upperTile));

    // Fetch the tiles
    for (let tile of tiles) {
      if (!(tile.toString() in window.iq_data)) {
        this.props.fetchMoreData({
          tile: tile,
          connection: connection,
          blob: blob,
          data_type: data_type,
          offset: tile * TILE_SIZE_IN_BYTES,
          count: TILE_SIZE_IN_BYTES,
        });
      }
    }
    this.renderImage(lowerTile, upperTile);
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
      stageRef,
      lowerTile,
      bytesPerSample,
      currentSamples,
      minimapNumFetches,
      rulerSideWidth,
      skipNFfts,
      spectrogramHeight,
      spectrogramWidth,
      upperTile,
      cursorsEnabled,
      openModal,
      timeSelectionStart,
    } = this.state;
    const fft = {
      size: fftSize,
      magnitudeMax: magnitudeMax,
      magnitudeMin: magnitudeMin,
    };

    var scrollBarHeight = (spectrogramHeight / (blob.totalBytes / bytesPerSample / 2 / fftSize)) * spectrogramHeight;
    if (scrollBarHeight < 20) scrollBarHeight = 20;
    return (
      <div style={{ marginTop: '30px' }}>
        <Container>
          <Row className="flex-nowrap">
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
              />
            </Col>
            <Col>
              <Row>
                <Col>
                  <div style={{ display: 'flex', justifyContent: 'right' }}>
                    {cursorsEnabled && (
                      <TimePlot currentSamples={currentSamples} toggleModal={this.toggleModal} openModal={openModal} />
                    )}
                    <Toggle id="toggle" defaultChecked={false} onChange={this.toggleCursors} />
                    <Form.Label htmlFor="toggle">Toggle Cursors</Form.Label>
                    &nbsp; &nbsp;
                    <Button
                      className="text-right"
                      variant="secondary"
                      onClick={() => {
                        this.handleMeta();
                        this.downloadInfo();
                      }}
                    >
                      <DownloadIcon></DownloadIcon>
                    </Button>
                  </div>

                  <Stage width={600} height={20}>
                    <RulerTop
                      fftSize={fftSize}
                      sampleRate={sampleRate}
                      timescale_width={20}
                      text_width={10}
                      spectrogram_width={spectrogramWidth}
                      fft={fft}
                      meta={meta}
                      blob={blob}
                      spectrogramWidthScale={spectrogramWidth / fftSize}
                    />
                  </Stage>
                  <Stage width={600} height={600} stageRef={stageRef}>
                    <Layer>
                      <Image image={image} x={0} y={0} width={600} height={600} />
                    </Layer>
                    <AnnotationViewer
                      handleMeta={this.handleMeta}
                      annotations={annotations}
                      spectrogramWidthScale={spectrogramWidth / fftSize}
                      meta={meta}
                      fftSize={fftSize}
                      lowerTile={lowerTile}
                      bytesPerSample={bytesPerSample}
                    />
                    {cursorsEnabled && (
                      <TimeSelector
                        spectrogramWidth={spectrogramWidth}
                        spectrogramHeight={spectrogramHeight}
                        upperTile={parseInt(upperTile)}
                        lowerTile={parseInt(lowerTile)}
                        handleTimeSelectionStart={this.handleTimeSelectionStart}
                        handleTimeSelectionEnd={this.handleTimeSelectionEnd}
                      />
                    )}
                  </Stage>
                </Col>
                <Col style={{ paddingTop: 60, paddingLeft: 0, paddingRight: 0 }}>
                  <Stage width={rulerSideWidth + 50} height={600}>
                    <RulerSide
                      spectrogram_width={spectrogramWidth}
                      fftSize={fftSize}
                      sampleRate={sampleRate}
                      currentRowAtTop={(lowerTile * TILE_SIZE_IN_BYTES) / 2 / bytesPerSample / fftSize}
                    />
                    <ScrollBar
                      fetchAndRender={this.fetchAndRender}
                      blob={blob}
                      spectrogram_height={spectrogramHeight}
                      bytesPerSample={bytesPerSample}
                      fftSize={fftSize}
                      minimapNumFetches={minimapNumFetches}
                      rulerSideWidth={rulerSideWidth}
                      meta={meta}
                      skipNFfts={skipNFfts}
                      size={this.props.minimap.size}
                    />
                  </Stage>
                </Col>
              </Row>
            </Col>
          </Row>
          <textarea
            rows="20"
            cols="130"
            onChange={this.handleMetaChange}
            value={JSON.stringify(this.state.meta, null, 4)}
          />
        </Container>
      </div>
    );
  }
}

export default SpectrogramPage;
