// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import DualRangeSlider from '@/features/ui/dual-range-slider/DualRangeSlider';
import { TILE_SIZE_IN_IQ_SAMPLES, COLORMAP_DEFAULT } from '@/utils/constants';
import { colMaps } from '@/utils/colormap';
import { useSpectrogramContext } from '../hooks/use-spectrogram-context';
import { useCursorContext } from '../hooks/use-cursor-context';

interface SettingsPaneProps {
  currentFFT: number;
}

const SettingsPane = ({ currentFFT }) => {
  const fftSizes = [128, 256, 512, 1024, 2048, 4096, 16384, 65536, TILE_SIZE_IN_IQ_SAMPLES];
  const context = useSpectrogramContext();
  const cursorContext = useCursorContext();
  const [localPythonSnippet, setLocalPythonSnippet] = useState(context.pythonSnippet);
  const [localTaps, setLocalTaps] = useState(JSON.stringify(context.taps));

  const onChangeWindowFunction = (event) => {
    const newWindowFunction = event.currentTarget.dataset.value;
    context.setWindowFunction(newWindowFunction);
  };

  const onSubmitPythonSnippet = () => {
    context.setPythonSnippet(localPythonSnippet);
  };

  const updateTaps = (taps_string: string) => {
    if (taps_string[0] === '[' && taps_string.slice(-1) === ']') {
      let temp_taps = taps_string.slice(1, -1).split(',');
      let temp_number_taps = temp_taps.map((x) => parseFloat(x));
      let taps = Float32Array.from(temp_number_taps);
      context.setTaps(temp_number_taps);
      console.debug('valid taps, found', taps.length, 'taps');
    } else {
      console.warn('invalid taps');
    }
  };

  const onSubmitTaps = () => {
    updateTaps(localTaps);
  };

  const onClickPremadeTaps = (event) => {
    let taps_string = event.currentTarget.dataset.value;
    setLocalTaps(taps_string);
    updateTaps(taps_string);
  };

  const onPressSaveButton = (e) => {
    console.log(context.meta);
    // Grab metadata and remove the parts that shouldn't be included in the metafile
    let metaClone = JSON.parse(JSON.stringify(context.meta));
    delete metaClone['dataClient'];
    const a = document.createElement('a');

    // Return with the download of the blob
    const blobUrl = window.URL.createObjectURL(
      new Blob([cursorContext.cursorData], { type: 'application/octet-stream' })
    );
    a.href = blobUrl;
    a.download = 'trimmedSamples.sigmf-data';
    a.click();
    window.URL.revokeObjectURL(blobUrl);

    a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(metaClone, null, 2));
    a.download = 'trimmedSamples.sigmf-meta';
    a.click();

    document.body.removeChild(a);
  };

  return (
    <div className="form-control">
      <label className="mb-3" id="formZoom">
        <span className="label-text text-base ">Zoom Level</span>
        <input
          type="range"
          className="range range-xs range-primary"
          value={context.fftStepSize + 1}
          min={1}
          max={10}
          step={1}
          onChange={(e) => {
            const newZoomLevel = parseInt(e.target.value);
            context.setFFTStepSize(newZoomLevel - 1);
          }}
        />
      </label>

      <label className="mb-1" id="toggle">
        <span className="label-text text-base">Toggle Time Cursors</span>
        <input
          type="checkbox"
          className="toggle toggle-primary float-right"
          checked={cursorContext.cursorTimeEnabled}
          onChange={(e) => {
            if (!cursorContext.cursorTimeEnabled && cursorContext.cursorTime.start == cursorContext.cursorTime.end) {
              cursorContext.setCursorTime({
                start: (currentFFT + context.spectrogramHeight / 4) * context.fftSize,
                end: (currentFFT + context.spectrogramHeight / 2) * context.fftSize,
              });
            }
            cursorContext.setCursorTimeEnabled(e.target.checked);
            context.setCanDownload(e.target.checked);
          }}
        />
      </label>

      <label className="mb-3" id="toggle">
        <span className="label-text text-base">Toggle Freq. Cursors</span>
        <input
          type="checkbox"
          className="toggle toggle-primary float-right"
          checked={cursorContext.cursorFreqEnabled}
          onChange={(e) => {
            if (!cursorContext.cursorFreqEnabled && cursorContext.cursorFreq.start == cursorContext.cursorFreq.end) {
              cursorContext.setCursorFreq({
                start: -0.2,
                end: 0.2,
              });
            }
            cursorContext.setCursorFreqEnabled(e.target.checked);
          }}
        />
      </label>

      <button
        className="mb-3"
        onClick={onPressSaveButton}
        style={{ width: '100%', marginTop: '5px' }}
        disabled={!context.canDownload}
      >
        Download Selected Samples
      </button>

      <div className="mb-3" id="formMagMax">
        <label>
          <span className="label-text text-base">Magnitude Color Mapping</span>
        </label>

        <DualRangeSlider
          min={-100.0}
          minValue={context.magnitudeMin}
          max={50.0}
          maxValue={context.magnitudeMax}
          setMin={context.setMagnitudeMin}
          setMax={context.setMagnitudeMax}
          unit="dB"
        />
      </div>
      <div className="mt-4">
        <details className="dropdown dropdown-right w-full">
          <summary className="btn btn-outline btn-success btn-sm w-full">
              Colormap <ArrowRightIcon />
          </summary>
          <ul className="p-2 shadow menu dropdown-content mt-0 z-[1] bg-base-100 rounded-box w-52">
          {Object.entries(colMaps).map(([value]) => (
              <li
                key={value}
                data-value={value}
                onClick={(e) => {
                  context.setColmap(e.currentTarget.dataset.value);
                }}
              >
                {context.colmap === value ? <a className="bg-primary text-black">{value}</a> : <a>{value}</a>}
              </li>
            ))}
          </ul>
        </details>
      </div>
      <div className="mt-4">
        <details className="dropdown dropdown-right w-full">
          <summary className=" btn btn-outline btn-success btn-sm w-full">
              FFT Size <ArrowRightIcon />
          </summary>
          <ul className="p-2 shadow menu dropdown-content z-[1] mt-0 bg-base-100 rounded-box w-52">
            {fftSizes.map((x, index) => (
              <li
                key={index}
                data-value={String(x)}
                onClick={(e) => {
                  context.setFFTSize(parseInt(e.currentTarget.dataset.value));
                }}
              >
                {context.fftSize === x ? <a className="bg-primary text-black">{x}</a> : <a>{x}</a>}
              </li>
            ))}
          </ul>
        </details>
      </div>
      <>
        <div className="mt-2" id="formTaps">
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
          <div className="mt-2 flex">
            <input
              type="text"
              className="h-8 w-54 rounded-l text-base-100 ml-1 pl-2"
              defaultValue={localTaps}
              onChange={(e) => {
                setLocalTaps(e.target.value);
              }}
            />
            <button className="rounded-none rounded-r" onClick={onSubmitTaps}>
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        </div>
      </>
      <div className="mt-2">
        <details className="dropdown dropdown-right w-full">
          <summary className=" btn btn-outline btn-success btn-sm w-full">
              Example Filter Taps <ArrowRightIcon />
          </summary>
          <ul className="p-2 shadow menu dropdown-content z-[1] mt-0 bg-base-100 rounded-box w-70">
          <li
                key={0}
                data-value="[0.021019600765633,0.05574786251380393,0.04504671465435009,-0.012858837474581268,-0.042883835223827396,0.013822126400016621,0.05882808073316635,-0.014316809227248763,-0.10299625870988743,0.015410773935742991,0.31701869995313076,0.48460819626209206,0.31701869995313076,0.015410773935742991,-0.10299625870988743,-0.014316809227248763,0.05882808073316635,0.013822126400016621,-0.042883835223827396,-0.012858837474581268,0.04504671465435009,0.05574786251380393,0.021019600765633]"
                onClick={onClickPremadeTaps}
              >
                <a>Low Pass Filter, Keep Center 50%</a>
              </li>
              <li
                key={1}
                data-value="[0.016149208122345958,0.0315506154302014,0.044989927419396177,0.05039076977222029,0.036274497853720514,0.007612901271369674,-0.02948294665811137,-0.053019565543615366,-0.048888438402198676,-0.004134055886676617,0.07118987013413654,0.15929327646574953,0.22747019061450077,0.2546143327815347,0.22747019061450077,0.15929327646574953,0.07118987013413654,-0.004134055886676617,-0.048888438402198676,-0.053019565543615366,-0.02948294665811137,0.007612901271369674,0.036274497853720514,0.05039076977222029,0.044989927419396177,0.0315506154302014,0.016149208122345958]"
                onClick={onClickPremadeTaps}
              >
                <a>Low Pass Filter, Keep Center 25%</a>
              </li>
          </ul>
        </details>
      </div>
      <div className="mt-4 mb-2">
        <details className="dropdown dropdown-right w-full">
        <summary className=" btn btn-outline btn-success btn-sm w-full">
              window <ArrowRightIcon />
          </summary>
          <ul className="p-2 shadow menu dropdown-content z-[1] mt-0 bg-base-100 rounded-box w-70">
            <li key={0} data-value="hamming" onClick={onChangeWindowFunction}>
              {context.windowFunction === 'hamming' ? <a className="active">Hamming</a> : <a>Hamming</a>}
            </li>
            <li key={1} data-value="rectangle" onClick={onChangeWindowFunction}>
              {context.windowFunction === 'rectangle' ? <a className="active">Rectangle</a> : <a>Rectangle</a>}
            </li>
            <li key={2} data-value="hanning" onClick={onChangeWindowFunction}>
              {context.windowFunction === 'hanning' ? <a className="active">Hanning</a> : <a>Hanning</a>}
            </li>
            <li key={3} data-value="barlett" onClick={onChangeWindowFunction}>
              {context.windowFunction === 'barlett' ? <a className="active">Barlett</a> : <a>Barlett</a>}
            </li>
            <li key={4} data-value="blackman" onClick={onChangeWindowFunction}>
              {context.windowFunction === 'blackman' ? <a className="active">Blackman</a> : <a>Blackman</a>}
            </li>
          </ul>
        </details>
      </div>
      <div id="toggleFreq">
        <label className="label">
          <span className="label-text text-base">Display RF Freq</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={context.includeRfFreq}
            onChange={(e) => {
              context.setIncludeRfFreq(e.target.checked);
            }}
          />
        </label>
      </div>
      <div className="mb-3" id="formPythonSnippet">
        <label className="label">
          <span className="label-text text-base">Python Snippet</span>
        </label>
        <textarea
          className="bg-base-content text-base-100 p-1"
          rows={6}
          cols={25}
          wrap="off"
          onChange={(e) => {
            setLocalPythonSnippet(e.target.value);
          }}
          value={localPythonSnippet}
        />
        <button onClick={onSubmitPythonSnippet}>Run Python</button>
      </div>
    </div>
  );
};

export default SettingsPane;
