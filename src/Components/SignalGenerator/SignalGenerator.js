// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Container, Row, Col } from 'react-bootstrap';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

export default function SignalGenerator(props) {
  const [state, setState] = useState({
    pythonSnippet: `\
import numpy as np
import matplotlib.pyplot as plt
import io
import base64
import time

from js import testvar
print(testvar) # example of reading in a var from javascript side

start_t = time.time()

t = np.arange(1024)
x = np.exp(2j*np.pi*0.05*t) # tone
n = np.random.randn(len(x)) + 1j*np.random.randn(len(x))
x = x + 0.1*n # add some complex noise

print("elapsed time in ms:", (time.time() - start_t)*1e3)  
`,
    freqPlotSnippet: `X = 10*np.log10(np.abs(np.fft.fftshift(np.fft.fft(x)))**2)
f = np.linspace(-0.5, 0.5, len(X))

plt.plot(f, X)
plt.grid()
plt.xlabel("Frequency [Hz Normalized]")
plt.ylabel("PSD [dB]")
`,
    timePlotSnippet: `plt.plot(x.real[0:100])
plt.plot(x.imag[0:100])
plt.legend(['I','Q'])
plt.grid()
plt.xlabel("Time")
plt.ylabel("Sample")
`,
    iqPlotSnippet: `plt.plot(x.real[0:1000], x.imag[0:1000], '.')
plt.legend(['I','Q'])
plt.grid()
plt.xlabel("I")
plt.ylabel("Q")
`,
    pyodide: null,
    b64ImageFreq: '',
    b64ImageTime: '',
    b64ImageIQ: '',
    errorLog: '',
    buttonDisabled: true,
    buttonText: 'Python Initializing...',
    currentTab: 'frequency',
  });

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

  useEffect(() => {
    if (!state.pyodide) {
      async function main() {
        console.log('Initializing Pyodide');
        let pyodide = await window.loadPyodide();
        await pyodide.loadPackage('numpy');
        await pyodide.loadPackage('matplotlib');
        console.log(
          pyodide.runPython(`
            import sys
            import numpy
            print('Python Version:', sys.version)
            print('NumPy Version:', numpy.version.version)
        `)
        );
        setState({ ...state, pyodide: pyodide, buttonText: 'Run', buttonDisabled: false });
      }
      main();
    }
  }, [state]);

  const prePlot = `
plt.rc('axes', labelsize=18) # fontsize of the x and y labels
plt.style.use('dark_background')
`;

  // keep newline in case prev block doesnt have one
  const postFreq = `
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

  const postCode = `
# clear all global vars except img's because anything thats not convertable to javascript will cause an error
for varname in list(globals().keys()):
   
   if varname not in ['__name__', '__doc__', '__package__', '__loader__', '__spec__', '__annotations__', '__builtins__', '_pyodide_core', 'sys', 'numpy', 'np', 'plt', 'io', 'base64', 'freq_img', 'time_img', 'iq_img']:
       globals()[varname] = None
#del x, n
`;

  const onSubmitPythonSnippet = () => {
    console.log('Running python snippet');
    window.testvar = 1234; // example of reading in a var from javascript side
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
            postCode
        )
        .then((output) => {
          console.log(output);
          const freqImgStr = state.pyodide.globals.toJs().get('freq_img') || '';
          const timeImgStr = state.pyodide.globals.toJs().get('time_img') || '';
          const iqImgStr = state.pyodide.globals.toJs().get('iq_img') || '';
          setState({
            ...state,
            errorLog: '',
            b64ImageFreq: 'data:image/png;base64, ' + freqImgStr,
            b64ImageTime: 'data:image/png;base64, ' + timeImgStr,
            b64ImageIQ: 'data:image/png;base64, ' + iqImgStr,
          }); // also clear errors
        })
        .catch((err) => {
          setState({ ...state, errorLog: String(err) });
        });
    }
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
              <Form.Group className="mb-3" controlId="formPythonSnippet">
                <CodeMirror
                  value={state.pythonSnippet}
                  height="700px"
                  width="600px"
                  extensions={[python()]}
                  onChange={onChangePythonSnippet}
                  theme="dark"
                />
                <br></br>
                <Button variant="secondary" disabled={state.buttonDisabled} onClick={onSubmitPythonSnippet}>
                  {state.buttonText}
                </Button>
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
                  theme="dark"
                />
                <br></br>
                <img src={state.b64ImageFreq} width="400px" alt="hit run to load" />
              </Tab>
              <Tab eventKey="time" title="Time">
                <CodeMirror
                  value={state.timePlotSnippet}
                  height="300px"
                  width="490px"
                  extensions={[python()]}
                  onChange={onChangeTimePlotSnippet}
                  theme="dark"
                />
                <br></br>
                <img src={state.b64ImageTime} width="400px" alt="hit run to load" />
              </Tab>
              <Tab eventKey="iq" title="IQ">
                <CodeMirror
                  value={state.iqPlotSnippet}
                  height="300px"
                  width="490px"
                  extensions={[python()]}
                  onChange={onChangeIQPlotSnippet}
                  theme="dark"
                />
                <br></br>
                <img src={state.b64ImageIQ} width="400px" alt="hit run to load" />
              </Tab>
              <Tab eventKey="spectrogram" title="Spectrogram">
                asdasdasd
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
