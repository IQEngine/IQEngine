// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Container, Row, Col } from 'react-bootstrap';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { examplesList } from './examples/exampleList';
import Select from 'react-select';

export default function SignalGenerator(props) {
  const [state, setState] = useState({
    pythonSnippet: examplesList[0].value,
    freqPlotSnippet: `\
X = 10*np.log10(np.abs(np.fft.fftshift(np.fft.fft(x)))**2)
f = np.linspace(-0.5, 0.5, len(X))

plt.plot(f, X)
plt.grid()
plt.xlabel("Frequency [Hz Normalized]")
plt.ylabel("PSD [dB]")
`,
    timePlotSnippet: `\
plt.plot(x.real[0:100])
plt.plot(x.imag[0:100])
plt.legend(['I','Q'])
plt.grid()
plt.xlabel("Time")
plt.ylabel("Sample")
`,
    iqPlotSnippet: `\
plt.plot(x.real[0:1000], x.imag[0:1000], '.')
plt.grid()
plt.xlabel("I")
plt.ylabel("Q")
`,
    spectrogramPlotSnippet: `\
fft_size = 1024
sample_rate = 1e6
num_rows = int(np.floor(len(x)/fft_size))
spectrogram = np.zeros((num_rows, fft_size))
for i in range(num_rows):
    spectrogram[i,:] = 10*np.log10(np.abs(np.fft.fftshift(np.fft.fft(x[i*fft_size:(i+1)*fft_size])))**2)

plt.imshow(spectrogram, aspect='auto', extent = [sample_rate/-2, sample_rate/2, 0, len(x)/sample_rate])
plt.xlabel("Frequency [Hz]")
plt.ylabel("Time [s]")
`,
    pyodide: null,
    b64ImageFreq: '',
    b64ImageTime: '',
    b64ImageIQ: '',
    errorLog: '<no errors>',
    buttonDisabled: true,
    buttonText: 'Python Initializing...',
    currentTab: 'frequency',
    downloadChecked: false,
    currentExample: 0,
  });

  const prePlot = `
plt.rc('axes', labelsize=14) # fontsize of the x and y labels
plt.style.use('dark_background')
`;

  // keep newline in case prev block doesnt have one
  const postFreq = `
import io
import base64
pic_IObytes = io.BytesIO()
plt.savefig(pic_IObytes, format='png', bbox_inches='tight')
pic_IObytes.seek(0)
freq_img = base64.b64encode(pic_IObytes.read()).decode() # the plot below will display whatever b64 is in img
plt.clf() 
`;

  const postTime = `
pic_IObytes = io.BytesIO()
plt.savefig(pic_IObytes, format='png', bbox_inches='tight')
pic_IObytes.seek(0)
time_img = base64.b64encode(pic_IObytes.read()).decode() # the plot below will display whatever b64 is in img
plt.clf() 
`;

  const postIQ = `
pic_IObytes = io.BytesIO()
plt.savefig(pic_IObytes, format='png', bbox_inches='tight')
pic_IObytes.seek(0)
iq_img = base64.b64encode(pic_IObytes.read()).decode() # the plot below will display whatever b64 is in img
plt.clf() 
`;

  const postSpectrogram = `
pic_IObytes = io.BytesIO()
plt.savefig(pic_IObytes, format='png', bbox_inches='tight')
pic_IObytes.seek(0)
spectrogram_img = base64.b64encode(pic_IObytes.read()).decode() # the plot below will display whatever b64 is in img
plt.clf() 
`;

  const postCode = `
try:
    x = x.astype(np.complex64)
    x_bytes = x.tobytes()
except BaseException as e:
    print("Ran into issue during converting x to bytes:")
    print(e)

# clear all global vars except img's because anything thats not convertable to javascript will cause an error
for varname in list(globals().keys()):
    if varname not in ['__name__', '__doc__', '__package__', '__loader__', '__spec__', '__annotations__', '__builtins__', '_pyodide_core', 'sys', 'numpy', 'np', 'plt', 'io', 'x_bytes', 'base64', 'freq_img', 'time_img', 'iq_img', 'spectrogram_img']:
        globals()[varname] = None
`;

  const onChangePythonSnippet = React.useCallback(
    (value, viewUpdate) => {
      setState({ ...state, pythonSnippet: value });
    },
    [state]
  );

  const onChangeFreqPlotSnippet = React.useCallback(
    (value, viewUpdate) => {
      setState({ ...state, freqPlotSnippet: value });
    },
    [state]
  );

  const onChangeTimePlotSnippet = React.useCallback(
    (value, viewUpdate) => {
      setState({ ...state, timePlotSnippet: value });
    },
    [state]
  );

  const onChangeIQPlotSnippet = React.useCallback(
    (value, viewUpdate) => {
      setState({ ...state, iqPlotSnippet: value });
    },
    [state]
  );

  const onChangeSpectrogramPlotSnippet = React.useCallback(
    (value, viewUpdate) => {
      setState({ ...state, spectrogramPlotSnippet: value });
    },
    [state]
  );

  useEffect(() => {
    if (!state.pyodide) {
      async function main() {
        console.log('Initializing Pyodide');
        let pyodide = await window.loadPyodide();
        await pyodide.loadPackage('numpy');
        await pyodide.loadPackage('scipy');
        await pyodide.loadPackage('matplotlib');
        pyodide.runPython(`
import sys
import numpy
print('Python Version:', sys.version)
print('NumPy Version:', numpy.version.version)
`);
        setState({ ...state, pyodide: pyodide, buttonText: 'Run', buttonDisabled: false });
      }
      main();
    }
  }, [state]);

  const onSubmitPythonSnippet = () => {
    setState({ ...state, buttonDisabled: true, buttonText: 'Running' });
    console.log('Running python snippet');
    const startTime = performance.now();
    if (state.pyodide) {
      state.pyodide
        .runPythonAsync(
          state.pythonSnippet +
            prePlot +
            state.freqPlotSnippet +
            postFreq +
            state.timePlotSnippet +
            postTime +
            state.iqPlotSnippet +
            postIQ +
            state.spectrogramPlotSnippet +
            postSpectrogram +
            postCode
        )
        .then(() => {
          const freqImgStr = state.pyodide.globals.toJs().get('freq_img') || '';
          const timeImgStr = state.pyodide.globals.toJs().get('time_img') || '';
          const iqImgStr = state.pyodide.globals.toJs().get('iq_img') || '';
          const spectrogramImgStr = state.pyodide.globals.toJs().get('spectrogram_img') || '';
          const xBytes = state.pyodide.globals.toJs().get('x_bytes') || null;
          setState({
            ...state,
            errorLog: '<no errors>',
            buttonDisabled: false,
            buttonText: 'Run',
            b64ImageFreq: 'data:image/png;base64, ' + freqImgStr,
            b64ImageTime: 'data:image/png;base64, ' + timeImgStr,
            b64ImageIQ: 'data:image/png;base64, ' + iqImgStr,
            b64ImageSpectrogram: 'data:image/png;base64, ' + spectrogramImgStr,
          }); // also clear errors
          console.log('Call to runPythonAsync took', performance.now() - startTime, 'milliseconds');

          // Create/Download SigMF recording file if requested
          if (state.downloadChecked) {
            // Data file
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style = 'display: none';
            var blob = new Blob([xBytes], { type: 'octet/stream' }),
              url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = 'samples.sigmf-data';
            a.click();
            window.URL.revokeObjectURL(url);

            // Meta file (assume user will fill it in with their details)
            const metaText = `\
{
  "global": {
      "core:datatype": "cf32_le",
      "core:sample_rate": 1000000,
      "core:hw": "IQEngine Python-Based Signal Generator",
      "core:author": "IQEngine User",
      "core:version": "1.0.0"
  },
  "captures": [
      {
          "core:sample_start": 0,
          "core:frequency": 123456789
      }
  ],
  "annotations": []
}
`;
            var a2 = document.createElement('a');
            a2.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(metaText));
            a2.setAttribute('download', 'samples.sigmf-meta');
            a2.style.display = 'none';
            document.body.appendChild(a2);
            a2.click();
            document.body.removeChild(a2);
          }
        })
        .catch((err) => {
          setState({ ...state, buttonDisabled: false, buttonText: 'Run', errorLog: String(err) });
          console.log('Call to runPythonAsync took', performance.now() - startTime, 'milliseconds');
        });
    }
  };

  const onChangeDownloadChecked = () => {
    setState({ ...state, downloadChecked: !state.downloadChecked });
  };

  const onChangeDropdown = (v) => {
    setState({ ...state, pythonSnippet: v.value });
  };

  // list of categories here https://react-select.com/styles#inner-components
  const dropdownStyle = {
    control: (base) => ({
      ...base,
      background: '#222222',
    }),
    menuList: (base) => ({
      ...base,
      background: '#222222',
    }),
    option: (base, state) => ({
      ...base,
      color: 'white',
      // the one being highlighted at the moment
      background: state.isFocused ? '#00bc8c' : '#222222',
    }),
    singleValue: (base) => ({
      ...base,
      // whats shown when you dont click the dropdown
      color: 'white',
    }),
  };

  return (
    <div style={{ marginTop: '30px' }}>
      <Container>
        <br></br>
        <center>
          <h2 style={{ color: '#00bc8c' }}>Python-Based Signal Generator</h2>
        </center>
        <Row>
          <Col>
            <Form>
              <Select
                defaultValue={examplesList[0]}
                styles={dropdownStyle}
                options={examplesList}
                onChange={onChangeDropdown}
              />
              <Form.Group className="mb-3" controlId="formPythonSnippet">
                <CodeMirror
                  value={state.pythonSnippet}
                  height="700px"
                  width="600px"
                  extensions={[python()]}
                  onChange={onChangePythonSnippet}
                  theme={vscodeDark}
                />
                <br></br>
                <Button variant="secondary" disabled={state.buttonDisabled} onClick={onSubmitPythonSnippet}>
                  {state.buttonText}
                </Button>
                <br></br>
                <input
                  type="checkbox"
                  value={state.downloadChecked}
                  checked={state.downloadChecked}
                  onChange={() => onChangeDownloadChecked()}
                />
                &nbsp; Download "x" as SigMF Recording
              </Form.Group>
            </Form>
            <div className="display-linebreak">
              Error log: <br></br> {state.errorLog}
            </div>
          </Col>
          <Col>
            <Tabs
              id="tabs"
              activeKey={state.currentTab}
              onSelect={(k) => {
                setState({ ...state, currentTab: k });
              }}
              className="mb-3"
            >
              <Tab eventKey="frequency" title="Freq">
                <CodeMirror
                  value={state.freqPlotSnippet}
                  height="300px"
                  width="490px"
                  extensions={[python()]}
                  onChange={onChangeFreqPlotSnippet}
                  theme={vscodeDark}
                />
                <br></br>
                <img src={state.b64ImageFreq} width="490px" alt="hit run to load" />
              </Tab>
              <Tab eventKey="time" title="Time">
                <CodeMirror
                  value={state.timePlotSnippet}
                  height="300px"
                  width="490px"
                  extensions={[python()]}
                  onChange={onChangeTimePlotSnippet}
                  theme={vscodeDark}
                />
                <br></br>
                <img src={state.b64ImageTime} width="490px" alt="hit run to load" />
              </Tab>
              <Tab eventKey="iq" title="IQ">
                <CodeMirror
                  value={state.iqPlotSnippet}
                  height="300px"
                  width="490px"
                  extensions={[python()]}
                  onChange={onChangeIQPlotSnippet}
                  theme={vscodeDark}
                />
                <br></br>
                <img src={state.b64ImageIQ} width="490px" alt="hit run to load" />
              </Tab>
              <Tab eventKey="spectrogram" title="Spectrogram">
                <CodeMirror
                  value={state.spectrogramPlotSnippet}
                  height="300px"
                  width="490px"
                  extensions={[python()]}
                  onChange={onChangeSpectrogramPlotSnippet}
                  theme={vscodeDark}
                />
                <br></br>
                <img src={state.b64ImageSpectrogram} width="490px" alt="hit run to load" />
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
