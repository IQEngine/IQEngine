// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { updateBlobTaps, resetBlobIQData } from '../../Store/Reducers/BlobReducer';
import { useAppDispatch } from '@/Store/hooks';
import { updateBlobPythonSnippet } from '@/Store/Reducers/BlobReducer';
import DualRangeSlider from '@/Components/DualRangeSlider/DualRangeSlider';

const SettingsPane = (props) => {
  const dispatch = useAppDispatch();

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
  });

  let [magnitudeMax, setMagnitudeMax] = useState(props.magnitudeMax);
  let [magnitudeMin, setMagnitudeMin] = useState(props.magnitudeMin);

  useEffect(() => {
    setMagnitudeMax(props.magnitudeMax);
  }, [props.magnitudeMax]);

  useEffect(() => {
    setMagnitudeMin(props.magnitudeMin);
  }, [props.magnitudeMin]);

  const onChangeWindowFunction = (event) => {
    const windowFunction = event.currentTarget.dataset.value;
    setState({ ...state, windowFunction: windowFunction });
    dispatch(resetBlobIQData());
    props.updateWindowChange(windowFunction);
  };

  const onChangeMagnitudeMax = (max) => {
    props.updateMagnitudeMax(parseInt(max));
  };

  const onChangeMagnitudeMin = (min) => {
    // currently a min of 0 doesnt actually work so just set it to 1
    if (min == 0) {
      props.updateMagnitudeMin(1);
    } else {
      props.updateMagnitudeMin(parseInt(min));
    }
  };

  const onChangeFftsize = (event) => {
    setState({ ...state, size: parseInt(event.target.value) });
  };

  const onSubmitFftsize = () => {
    const intSize = parseInt(state.size);
    if (intSize >= 32 && Math.log2(intSize) % 1 === 0) {
      props.updateFftsize(state.size);
    } else {
      alert('Size must be a power of 2 and at least 32');
    }
  };

  const onChangePythonSnippet = (event) => {
    setState({ ...state, pythonSnippet: event.target.value });
  };

  const onSubmitPythonSnippet = () => {
    dispatch(resetBlobIQData());
    dispatch(updateBlobPythonSnippet(state.pythonSnippet));
  };

  const onChangeTaps = (event) => {
    setState({ ...state, taps: event.target.value });
  };

  const onSubmitTaps = () => {
    let taps = new Array(1).fill(1);
    // make sure the string is a valid array
    let taps_string = state.taps;
    if (taps_string[0] === '[' && taps_string.slice(-1) === ']') {
      taps = taps_string.slice(1, -1).split(',');
      taps = taps.map((x) => parseFloat(x));
      taps = Float32Array.from(taps);
      dispatch(updateBlobTaps(taps));
      // We apply the taps when we download the IQ data, so we have to clear both
      dispatch(resetBlobIQData());
      console.log('valid taps, found', taps.length, 'taps');
    } else {
      console.alert('invalid taps');
    }
    dispatch(updateBlobTaps(taps));
  };

  const onClickPremadeTaps = (event) => {
    let taps = new Array(1).fill(1);
    let taps_string = event.currentTarget.dataset.value;
    if (taps_string[0] === '[' && taps_string.slice(-1) === ']') {
      taps = taps_string.slice(1, -1).split(',');
      taps = taps.map((x) => parseFloat(x));
      taps = Float32Array.from(taps);
      dispatch(updateBlobTaps(taps));
      // We apply the taps when we download the IQ data, so we have to clear both
      dispatch(resetBlobIQData());

      console.log('valid taps, found', taps.length, 'taps');
    } else {
      console.alert('invalid taps');
    }
    setState({ ...state, taps: taps_string });
    dispatch(updateBlobTaps(taps));
  };

  const onChangeZoomLevel = (e) => {
    setState({ ...state, zoomLevel: e.target.value });
    props.updateZoomLevel(e.target.value);
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
        <input
          type="checkbox"
          className="toggle checkbox checkbox-primary float-right"
          onChange={props.toggleCursors}
        />
      </label>

      <div className="mb-3" id="formMagMax">
        <label>
          <span className="label-text text-base">Magnitude Color Mapping</span>
        </label>

        <DualRangeSlider
          min={0}
          minValue={magnitudeMin}
          max={255}
          maxValue={magnitudeMax}
          onChangeMin={onChangeMagnitudeMin}
          onChangeMax={onChangeMagnitudeMax}
        />
      </div>
      <div>
        {/* When you press this button it will make autoscale run during the next call to selectFft, then it will turn itself off */}
        <button
          className="mb-3 btn-primary"
          onClick={props.handleAutoScale}
          style={{ width: '100%', marginTop: '5px' }}
        >
          Autoscale Max/Min
        </button>
      </div>

      <div className="mb-3" id="formFFT">
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
        <div className="mb-3">
          <input
            type="text"
            className="h-10 rounded-l text-base-100 ml-1 pl-2"
            defaultValue={state.size}
            onChange={onChangeFftsize}
            size="sm"
          />
          <button className="btn-primary rounded-none rounded-r" onClick={onSubmitFftsize}>
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
      </div>

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
        <div className="mb-3">
          <input
            type="text"
            className="h-10 rounded-l text-base-100 ml-1 pl-2"
            defaultValue={state.taps}
            onChange={onChangeTaps}
            size="sm"
          />
          <button className="btn-primary rounded-none rounded-r" onClick={onSubmitTaps}>
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
      </div>

      <div className="mb-3 flex">
        <div className="dropdown dropdown-hover">
          <label tabIndex={0} className="btn-primary m-1">
            Example Filter Taps
          </label>
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
          style={{ textDecoration: 'none', color: 'white', margin: '5px 0 0 5px' }}
          target="_blank"
          rel="noreferrer"
          href="http://t-filter.engineerjs.com/" //DevSkim: ignore DS137138
        >
          <InfoOutlinedIcon></InfoOutlinedIcon>
        </a>
      </div>

      <div className="mb-3 flex">
        <div className="dropdown dropdown-hover">
          <label tabIndex={0} className="btn-primary m-1">
            Window
          </label>
          <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
            <li data-value="hamming" onClick={onChangeWindowFunction}>
              {state.windowFunction === 'hamming' ? <a className="bg-primary">Hamming</a> : <a>Hamming</a>}
            </li>
            <li active={state.windowFunction === 'rectangle'} data-value="rectangle" onClick={onChangeWindowFunction}>
              {state.windowFunction === 'rectangle' ? <a className="bg-primary">Rectangle</a> : <a>Rectangle</a>}
            </li>
            <li active={state.windowFunction === 'hanning'} data-value="hanning" onClick={onChangeWindowFunction}>
              {state.windowFunction === 'hanning' ? <a className="bg-primary">Hanning</a> : <a>Hanning</a>}
            </li>
            <li active={state.windowFunction === 'barlett'} data-value="barlett" onClick={onChangeWindowFunction}>
              {state.windowFunction === 'barlett' ? <a className="bg-primary">Barlett</a> : <a>Barlett</a>}
            </li>
            <li active={state.windowFunction === 'blackman'} data-value="blackman" onClick={onChangeWindowFunction}>
              {state.windowFunction === 'blackman' ? <a className="bg-primary">Blackman</a> : <a>Blackman</a>}
            </li>
          </ul>
        </div>
        <a
          style={{ textDecoration: 'none', color: 'white', margin: '5px 0 0 5px' }}
          target="_blank"
          rel="noreferrer"
          href="https://pysdr.org/content/frequency_domain.html#windowing"
        >
          <HelpOutlineOutlinedIcon />
        </a>
      </div>

      <div className="mb-3" id="toggleFreq">
        <label className="label">
          <span className="label-text text-base">Display RF Freq</span>
          <input type="checkbox" className="toggle checkbox checkbox-primary" onChange={props.toggleIncludeRfFreq} />
        </label>
      </div>

      <div className="mb-3" id="formPythonSnippet">
        <label className="label">
          <span className="label-text text-base">Python Snippet</span>
        </label>
        <textarea
          className="bg-neutral text-base-100 p-1"
          rows="6"
          cols="28"
          wrap="off"
          onChange={onChangePythonSnippet}
          value={state.pythonSnippet}
        />
        <button className="btn-primary" onClick={onSubmitPythonSnippet}>
          Run Python
        </button>
      </div>
    </div>
  );
};

export default SettingsPane;
