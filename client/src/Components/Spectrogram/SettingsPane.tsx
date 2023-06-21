// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import DualRangeSlider from '@/Components/DualRangeSlider/DualRangeSlider';
import { SigMFMetadata } from '@/Utils/sigmfMetadata';
import { TILE_SIZE_IN_IQ_SAMPLES } from '@/Utils/constants';

export class SettingsPaneProps {
  meta: SigMFMetadata;
  magnitudeMax: number;
  magnitudeMin: number;
  taps: Float32Array = Float32Array.from([1]);
  updateWindowChange: any;
  updateMagnitudeMax: any;
  updateMagnitudeMin: any;
  updateFftsize: any;
  toggleIncludeRfFreq: any;
  handleAutoScale: any;
  toggleCursors: any;
  updateZoomLevel: any;
  autoScale: boolean;
  windowFunction: string;
  zoomLevel: number;
  setTaps: (taps: number[]) => void;
  pythonSnippet: string;
  setPythonSnippet: (pythonSnippet: string) => void;
  handleProcessTime: () => { trimmedSamples: number[]; startSampleOffset: number };
}

const SettingsPane = (props: SettingsPaneProps) => {
  const fftSizes = [128, 256, 512, 1024, 2048, 4096, 16384, 65536, TILE_SIZE_IN_IQ_SAMPLES];

  const [state, setState] = useState({
    size: 1024,
    taps: '[1]',

    // give users an example of how it works
    pythonSnippet: `import numpy as np
import time
start_t = time.time()
x = x*1
print("Time elapsed:", (time.time() - start_t)*1e3, "ms")`,

    windowFunction: 'hamming',
    zoomLevel: 1,
    saveButtonEnabled: false,
  });

  const onChangeWindowFunction = (event) => {
    const windowFunction = event.currentTarget.dataset.value;
    setState({ ...state, windowFunction: windowFunction });
    props.updateWindowChange(windowFunction);
  };

  const onChangeFftsize = (event) => {
    const newSize = parseInt(event.target.text);
    setState({ ...state, size: newSize });
    props.updateFftsize(newSize);
  };

  const onChangePythonSnippet = (event) => {
    setState({ ...state, pythonSnippet: event.target.value });
  };

  const onSubmitPythonSnippet = () => {
    props.setPythonSnippet(state.pythonSnippet);
  };

  const onChangeTaps = (event) => {
    setState({ ...state, taps: event.target.value });
  };

  const updateTaps = (taps_string: string) => {
    if (taps_string[0] === '[' && taps_string.slice(-1) === ']') {
      let temp_taps = taps_string.slice(1, -1).split(',');
      let temp_number_taps = temp_taps.map((x) => parseFloat(x));
      let taps = Float32Array.from(temp_number_taps);
      props.setTaps(temp_number_taps);
      console.debug('valid taps, found', taps.length, 'taps');
    } else {
      console.warn('invalid taps');
    }
  };

  const onSubmitTaps = () => {
    // make sure the string is a valid array
    let taps_string = state.taps;
    updateTaps(taps_string);
  };

  const onClickPremadeTaps = (event) => {
    let taps_string = event.currentTarget.dataset.value;
    setState({ ...state, taps: taps_string }); // TODO: WHY ISNT THIS WORKING!?
    updateTaps(taps_string);
  };

  const onChangeZoomLevel = (e) => {
    setState({ ...state, zoomLevel: e.target.value });
    props.updateZoomLevel(e.target.value);
  };

  const onToggleCursors = (e) => {
    setState({ ...state, saveButtonEnabled: !state.saveButtonEnabled });
    props.toggleCursors(e);
  };

  const onPressSaveButton = (e) => {
    const { trimmedSamples, _ } = props.handleProcessTime();

    console.log(props.meta);

    var blob = new Blob([trimmedSamples], { type: 'octet/stream' });

    // Grab metadata and remove the parts that shouldn't be included in the metafile
    let metaClone = JSON.parse(JSON.stringify(props.meta));
    delete metaClone['dataClient'];

    var blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';

    a.href = blobUrl;
    a.download = 'trimmedSamples.sigmf-data';
    a.click();

    a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(metaClone, null, 2));
    a.download = 'trimmedSamples.sigmf-meta';
    a.click();

    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  };

  return (
    <div className="form-control">
      <label className="mb-3" id="formZoom">
        <span className="label-text text-base ">Zoom Level</span>
        <input
          type="range"
          className="range range-xs range-primary"
          value={state.zoomLevel}
          min={1}
          max={10}
          step={1}
          onChange={onChangeZoomLevel}
        />
      </label>

      <label className="mb-3" id="toggle">
        <span className="label-text text-base">Toggle Cursors</span>
        <input type="checkbox" className="toggle toggle-primary float-right" onChange={onToggleCursors} />
      </label>

      <button
        className="mb-3"
        onClick={onPressSaveButton}
        style={{ width: '100%', marginTop: '5px' }}
        disabled={!state.saveButtonEnabled}
      >
        Save Selection
      </button>

      <div className="mb-3" id="formMagMax">
        <label>
          <span className="label-text text-base">Magnitude Color Mapping</span>
        </label>

        <DualRangeSlider
          min={-100.0}
          minValue={props.magnitudeMin}
          max={50.0}
          maxValue={props.magnitudeMax}
          setMin={props.updateMagnitudeMin}
          setMax={props.updateMagnitudeMax}
          unit="dB"
        />
      </div>
      <div>
        {/* When you press this button it will make autoscale run during the next call to selectFft, then it will turn itself off */}
        {/*  Disable auto scale button until the functionality gets fixed
        <button className="mb-3 w-full mt-2" onClick={props.handleAutoScale}>
          Autoscale Max/Min
        </button>
        */}
      </div>

      <div id="formFFT">
        <label className="label">
          <span className="label-text text-base">
            FFT Size
            <a
              style={{ textDecoration: 'none', color: 'white', marginLeft: '5px' }}
              target="_blank"
              rel="noreferrer"
              href="https://pysdr.org/content/frequency_domain.html#fft-sizing"
            >
              <HelpOutlineOutlinedIcon />
            </a>
          </span>
        </label>

        <div className="dropdown dropdown-hover">
          <button tabIndex={0} className="m-1 px-16 w-full">
            FFT Size
          </button>
          <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
            {fftSizes.map((x) => (
              <li data-value={String(x)} onClick={onChangeFftsize}>
                {state.size === x ? <a className="bg-primary">{x}</a> : <a>{x}</a>}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <>
        <div className="mb-3" id="formTaps">
          <label className="label">
            <span className="label-text text-base">
              FIR Filter Taps
              <a
                style={{ textDecoration: 'none', color: 'white', marginLeft: '5px' }}
                target="_blank"
                rel="noreferrer"
                href="https://pysdr.org/content/filters.html"
              >
                <HelpOutlineOutlinedIcon />
              </a>
            </span>
          </label>
          <div className="mb-3 flex">
            <input
              type="text"
              className="h-8 w-54 rounded-l text-base-100 ml-1 pl-2"
              defaultValue={state.taps}
              onChange={onChangeTaps}
            />
            <button className="rounded-none rounded-r" onClick={onSubmitTaps}>
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        </div>

        <div className="mb-3 flex">
          <div className="dropdown dropdown-hover">
            <button tabIndex={0} className="m-1 px-7 w-full">
              Example Filter Taps
            </button>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
              <li
                data-value="[0.021019600765633,0.05574786251380393,0.04504671465435009,-0.012858837474581268,-0.042883835223827396,0.013822126400016621,0.05882808073316635,-0.014316809227248763,-0.10299625870988743,0.015410773935742991,0.31701869995313076,0.48460819626209206,0.31701869995313076,0.015410773935742991,-0.10299625870988743,-0.014316809227248763,0.05882808073316635,0.013822126400016621,-0.042883835223827396,-0.012858837474581268,0.04504671465435009,0.05574786251380393,0.021019600765633]"
                onClick={onClickPremadeTaps}
              >
                <a>Low Pass Filter, Keep Center 50%</a>
              </li>
              <li
                data-value="[0.016149208122345958,0.0315506154302014,0.044989927419396177,0.05039076977222029,0.036274497853720514,0.007612901271369674,-0.02948294665811137,-0.053019565543615366,-0.048888438402198676,-0.004134055886676617,0.07118987013413654,0.15929327646574953,0.22747019061450077,0.2546143327815347,0.22747019061450077,0.15929327646574953,0.07118987013413654,-0.004134055886676617,-0.048888438402198676,-0.053019565543615366,-0.02948294665811137,0.007612901271369674,0.036274497853720514,0.05039076977222029,0.044989927419396177,0.0315506154302014,0.016149208122345958]"
                onClick={onClickPremadeTaps}
              >
                <a>Low Pass Filter, Keep Center 25%</a>
              </li>
            </ul>
          </div>
          <a
            className="ml-3 mt-1"
            target="_blank"
            rel="noreferrer"
            href="http://t-filter.engineerjs.com/" //DevSkim: ignore DS137138
          >
            <InfoOutlinedIcon></InfoOutlinedIcon>
          </a>
        </div>
      </>

      <div className="mb-3">
        <div className="dropdown dropdown-hover">
          <button tabIndex={0} className="m-1 px-16 w-full">
            Window
          </button>
          <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
            <li data-value="hamming" onClick={onChangeWindowFunction}>
              {state.windowFunction === 'hamming' ? <a className="bg-primary">Hamming</a> : <a>Hamming</a>}
            </li>
            <li data-value="rectangle" onClick={onChangeWindowFunction}>
              {state.windowFunction === 'rectangle' ? <a className="bg-primary">Rectangle</a> : <a>Rectangle</a>}
            </li>
            <li data-value="hanning" onClick={onChangeWindowFunction}>
              {state.windowFunction === 'hanning' ? <a className="bg-primary">Hanning</a> : <a>Hanning</a>}
            </li>
            <li data-value="barlett" onClick={onChangeWindowFunction}>
              {state.windowFunction === 'barlett' ? <a className="bg-primary">Barlett</a> : <a>Barlett</a>}
            </li>
            <li data-value="blackman" onClick={onChangeWindowFunction}>
              {state.windowFunction === 'blackman' ? <a className="bg-primary">Blackman</a> : <a>Blackman</a>}
            </li>
          </ul>
        </div>
        <a
          className="ml-4"
          target="_blank"
          rel="noreferrer"
          href="https://pysdr.org/content/frequency_domain.html#windowing"
        >
          <HelpOutlineOutlinedIcon />
        </a>
      </div>

      <div id="toggleFreq">
        <label className="label">
          <span className="label-text text-base">Display RF Freq</span>
          <input type="checkbox" className="toggle toggle-primary" onChange={props.toggleIncludeRfFreq} />
        </label>
      </div>
      <div className="mb-3" id="formPythonSnippet">
        <label className="label">
          <span className="label-text text-base">Python Snippet</span>
        </label>
        <textarea
          className="bg-base-content text-base-100 p-1"
          rows={6}
          cols={28}
          wrap="off"
          onChange={onChangePythonSnippet}
          value={state.pythonSnippet}
        />
        <button onClick={onSubmitPythonSnippet}>Run Python</button>
      </div>
    </div>
  );
};

export default SettingsPane;
