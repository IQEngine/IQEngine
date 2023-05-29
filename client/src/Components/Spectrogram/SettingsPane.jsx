// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import Toggle from 'react-toggle';
import RangeSlider from 'react-bootstrap-range-slider';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import { updateBlobTaps, resetBlobIQData } from '../../Store/Reducers/BlobReducer';
import { useAppDispatch } from '@/Store/hooks';

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
    setState({ ...state, windowFunction: event });
    props.updateWindowChange(event);
  };

  const onChangeMagnitudeMax = (e) => {
    setMagnitudeMax(parseInt(e.target.value));
    props.updateMagnitudeMax(parseInt(e.target.value));
  };

  const onChangeMagnitudeMin = (e) => {
    setMagnitudeMin(parseInt(e.target.value));
    // currently a min of 0 doesnt actually work so just set it to 1
    if (e.target.value == 0) {
      props.updateMagnitudeMin(1);
    } else {
      props.updateMagnitudeMin(parseInt(e.target.value));
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
    props.updatePythonSnippet(state.pythonSnippet);
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
    let taps_string = event;
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
    <Form>
      <Form.Group className="mb-3" controlId="formZoom">
        <Form.Label className="text-center" style={{ width: '100%' }}>
          Zoom Level
        </Form.Label>
        <RangeSlider
          value={state.zoomLevel}
          tooltip="on"
          tooltipPlacement="top"
          variant="secondary"
          min={1}
          max={10}
          step={1}
          onChange={onChangeZoomLevel}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="toggle">
        <Toggle id="toggle" defaultChecked={false} onChange={props.toggleCursors} />
        <Form.Label style={{ marginLeft: '10px', marginBottom: '0px' }}> Toggle Cursors</Form.Label>
      </Form.Group>

      <Form.Group className="mb-3" controlId="formMagMax">
        <div className="text-center font-bold">Magnitude Color Mapping</div>
        <InputGroup className="mb-3 mt-1">
          <Form.Label className="pr-3">Max:</Form.Label>
          <Form.Label className="text-xs">{magnitudeMin + 1}</Form.Label>
          <RangeSlider
            value={magnitudeMax}
            tooltip="on"
            tooltipPlacement="bottom"
            variant="secondary"
            min={magnitudeMin + 1}
            max={255}
            step={1}
            onChange={onChangeMagnitudeMax}
          />
          <Form.Label className="text-xs">255</Form.Label>
        </InputGroup>

        <InputGroup>
          <Form.Label className="pr-4">Min:</Form.Label>
          <Form.Label className="text-xs">0</Form.Label>
          <RangeSlider
            value={magnitudeMin}
            tooltip="on"
            tooltipPlacement="top"
            variant="secondary"
            min={0}
            max={magnitudeMax - 1}
            step={1}
            onChange={onChangeMagnitudeMin}
          />
          <Form.Label className="text-xs">{magnitudeMax - 1}</Form.Label>
        </InputGroup>

        {/* When you press this button it will make autoscale run during the next call to selectFft, then it will turn itself off */}
        <Button
          className="mb-3"
          variant="secondary"
          onClick={props.handleAutoScale}
          style={{ width: '100%', marginTop: '5px' }}
        >
          Autoscale Max/Min
        </Button>
      </Form.Group>

      <Form.Group className="mb-3" controlId="formFFT">
        <Form.Label>
          FFT Size
          <a
            style={{ textDecoration: 'none', color: 'white', marginLeft: '5px' }}
            target="_blank"
            rel="noreferrer"
            href="https://pysdr.org/content/frequency_domain.html#fft-sizing"
          >
            <HelpOutlineOutlinedIcon />
          </a>
        </Form.Label>
        <InputGroup className="mb-3">
          <Form.Control type="text" defaultValue={state.size} onChange={onChangeFftsize} size="sm" />
          <Button variant="secondary" onClick={onSubmitFftsize}>
            <FontAwesomeIcon icon={faArrowRight} />
          </Button>
        </InputGroup>
      </Form.Group>

      <Form.Group className="mb-3" controlId="formTaps">
        <Form.Label style={{ display: 'flex' }}>
          FIR Filter Taps<br></br>
          <a
            style={{ textDecoration: 'none', color: 'white', marginLeft: '5px' }}
            target="_blank"
            rel="noreferrer"
            href="https://pysdr.org/content/filters.html"
          >
            <HelpOutlineOutlinedIcon />
          </a>
        </Form.Label>
        <InputGroup className="mb-3">
          <Form.Control type="text" defaultValue={state.taps} onChange={onChangeTaps} size="sm" />
          <Button variant="secondary" onClick={onSubmitTaps}>
            <FontAwesomeIcon icon={faArrowRight} />
          </Button>
        </InputGroup>
      </Form.Group>

      <div style={{ display: 'flex' }}>
        <DropdownButton variant="secondary" title="Example Filter Taps" className="mb-3" onSelect={onClickPremadeTaps}>
          <Dropdown.Item eventKey="[0.021019600765633,0.05574786251380393,0.04504671465435009,-0.012858837474581268,-0.042883835223827396,0.013822126400016621,0.05882808073316635,-0.014316809227248763,-0.10299625870988743,0.015410773935742991,0.31701869995313076,0.48460819626209206,0.31701869995313076,0.015410773935742991,-0.10299625870988743,-0.014316809227248763,0.05882808073316635,0.013822126400016621,-0.042883835223827396,-0.012858837474581268,0.04504671465435009,0.05574786251380393,0.021019600765633]">
            Low Pass Filter, Keep Center 50%
          </Dropdown.Item>
          <Dropdown.Item eventKey="[0.016149208122345958,0.0315506154302014,0.044989927419396177,0.05039076977222029,0.036274497853720514,0.007612901271369674,-0.02948294665811137,-0.053019565543615366,-0.048888438402198676,-0.004134055886676617,0.07118987013413654,0.15929327646574953,0.22747019061450077,0.2546143327815347,0.22747019061450077,0.15929327646574953,0.07118987013413654,-0.004134055886676617,-0.048888438402198676,-0.053019565543615366,-0.02948294665811137,0.007612901271369674,0.036274497853720514,0.05039076977222029,0.044989927419396177,0.0315506154302014,0.016149208122345958]">
            Low Pass Filter, Keep Center 25%
          </Dropdown.Item>
        </DropdownButton>
        <a
          style={{ textDecoration: 'none', color: 'white', margin: '5px 0 0 5px' }}
          target="_blank"
          rel="noreferrer"
          href="http://t-filter.engineerjs.com/" //DevSkim: ignore DS137138
        >
          <InfoOutlinedIcon></InfoOutlinedIcon>
        </a>
      </div>

      <Form.Label style={{ display: 'flex' }}>
        <DropdownButton
          title="Window"
          variant="secondary"
          className="mb-0"
          id="dropdown-menu-align-right"
          onSelect={onChangeWindowFunction}
        >
          <Dropdown.Item active={state.windowFunction === 'hamming'} eventKey="hamming">
            Hamming
          </Dropdown.Item>
          <Dropdown.Item active={state.windowFunction === 'rectangle'} eventKey="rectangle">
            Rectangle
          </Dropdown.Item>
          <Dropdown.Item active={state.windowFunction === 'hanning'} eventKey="hanning">
            Hanning
          </Dropdown.Item>
          <Dropdown.Item active={state.windowFunction === 'barlett'} eventKey="barlett">
            Barlett
          </Dropdown.Item>
          <Dropdown.Item active={state.windowFunction === 'blackman'} eventKey="blackman">
            Blackman
          </Dropdown.Item>
        </DropdownButton>
        <a
          style={{ textDecoration: 'none', color: 'white', margin: '5px 0 0 5px' }}
          target="_blank"
          rel="noreferrer"
          href="https://pysdr.org/content/frequency_domain.html#windowing"
        >
          <HelpOutlineOutlinedIcon />
        </a>
      </Form.Label>

      <Form.Group className="mt-3" controlId="toggleFreq">
        <Toggle id="toggle" defaultChecked={false} onChange={props.toggleIncludeRfFreq} />
        <Form.Label style={{ marginLeft: '10px' }}> Display RF Freq</Form.Label>
      </Form.Group>

      <Form.Group className="mb-3" controlId="formPythonSnippet">
        <Form.Label style={{ display: 'flex' }}>
          Python Snippet<br></br>
        </Form.Label>
        <textarea rows="6" cols="28" wrap="off" onChange={onChangePythonSnippet} value={state.pythonSnippet} />
        <br></br>
        <Button variant="secondary" style={{ float: 'right' }} onClick={onSubmitPythonSnippet}>
          Run Python
        </Button>
        <br></br>
      </Form.Group>
    </Form>
  );
};

export default SettingsPane;
