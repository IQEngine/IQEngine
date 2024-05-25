// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import DualRangeSlider from '@/features/ui/dual-range-slider/DualRangeSlider';
import { colMaps } from '@/utils/colormap';
import { useSpectrogramContext } from '../hooks/use-spectrogram-context';
import { useCursorContext } from '../hooks/use-cursor-context';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import CodeMirror from '@uiw/react-codemirror';
import { langs } from '@uiw/codemirror-extensions-langs';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

interface SettingsPaneProps {
  currentFFT: number;
}

const SettingsPane = ({ currentFFT }) => {
  const fftSizes = [64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536];
  const zoomLevels = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const windowFunctions = ['hamming', 'rectangle', 'hanning', 'barlett', 'blackman'];
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

  // Calculate number of ffts we skip per image line in order to show N% of the total file in the spectrogram. The first element in the array is special, don't skip
  const onePercent = context.meta.getTotalSamples() / context.fftSize / 100;
  const zoomStepSizes = zoomLevels.map((z) => Math.floor((onePercent * z) / context.spectrogramHeight));

  const onChangePythonSnippet = useCallback(
    (value: string) => {
      setLocalPythonSnippet(value);
    },
    [localPythonSnippet]
  );

  return (
    <div className="form-control">
      <label className="mb-3" id="formZoom">
        <span className="label-text text-base ">Zoom Out Level</span>
        <input
          type="range"
          className="range range-xs range-primary"
          value={zoomStepSizes.indexOf(context.fftStepSize)}
          min={0}
          max={zoomStepSizes.length - 1}
          step={1}
          onChange={(e) => {
            const newZoomLevel = zoomStepSizes[parseInt(e.target.value)];
            context.setFFTStepSize(newZoomLevel);
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
        <div className="dropdown dropdown-hover dropdown-right w-full">
          <label tabIndex={0} className="btn btn-outline btn-success btn-sm w-full text-base">
            Colormap <ArrowRightIcon />
          </label>
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
        </div>
      </div>

      <div className="mt-4">
        <div className="dropdown dropdown-hover dropdown-right w-full">
          <label tabIndex={0} className="btn btn-outline btn-success btn-sm w-full text-base">
            FFT Size <ArrowRightIcon />
          </label>
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
        </div>
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
              <FontAwesomeIcon icon={faArrowRight as IconProp} />
            </button>
          </div>
        </div>
      </>

      <div className="mt-2">
        <div className="dropdown dropdown-hover dropdown-right w-full">
          <label tabIndex={0} className="btn btn-outline btn-success btn-sm w-full text-base">
            Example Filter Taps <ArrowRightIcon />
          </label>
          <ul className="p-2 shadow menu dropdown-content z-[1] mt-0 bg-base-100 rounded-box w-96">
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
        </div>
      </div>

      <div className="mt-4 mb-2">
        <div className="dropdown dropdown-hover dropdown-right w-full">
          <label tabIndex={0} className="btn btn-outline btn-success btn-sm w-full text-base">
            Window <ArrowRightIcon />
          </label>
          <ul className="p-2 shadow menu dropdown-content z-[1] mt-0 bg-base-100 rounded-box w-70">
            {windowFunctions.map((value) => (
              <li key={value} data-value={value} onClick={onChangeWindowFunction}>
                <a className={'capitalize ' + (context.windowFunction === value && 'bg-primary text-black')}>{value}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div id="toggleFreq">
        <label className="label py-0">
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

      <div id="toggleSquaring">
        <label className="label pb-0 pt-2">
          <span className="label-text text-base">Square Signal</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={context.squareSignal}
            onChange={(e) => {
              context.setSquareSignal(e.target.checked);
            }}
          />
        </label>
      </div>

      <div className="mb-3" id="formPythonSnippet">
        <label className="label">
          <span className="label-text text-base">Python Snippet</span>
        </label>

        <CodeMirror
          className="mb-3"
          value={localPythonSnippet}
          onChange={onChangePythonSnippet}
          height="150px"
          theme={vscodeDark}
          extensions={[langs.python()]}
          basicSetup={{
            lineNumbers: false,
            foldGutter: false,
          }}
        />

        <button onClick={onSubmitPythonSnippet}>Run Python</button>
      </div>
    </div>
  );
};

export default SettingsPane;
