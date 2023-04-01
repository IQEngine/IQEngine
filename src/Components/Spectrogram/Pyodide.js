// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';

const Pyodide = (props) => {
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
x = np.exp(2j*np.pi*0.1*t) # tone
X = 10*np.log10(np.abs(np.fft.fftshift(np.fft.fft(x)))**2)
del x # we cant leave any globals that include complex numbers or the conversion back to javascript gets mad
f = np.linspace(-0.5, 0.5, len(X))

plt.cla() # clear any previous plots
plt.plot(f, X)
plt.xlabel("Frequency [Hz Normalized]")
plt.ylabel("PSD [dB]")

pic_IObytes = io.BytesIO()
plt.savefig(pic_IObytes, format='png', bbox_inches='tight')
pic_IObytes.seek(0)
img = base64.b64encode(pic_IObytes.read()).decode() # the plot below will display whatever b64 is in img
print("elapsed time in ms:", (time.time() - start_t)*1e3)
`,
    pyodide: null,
    b64Image: '',
    errorLog: '',
  });

  useEffect(() => {
    async function main() {
      console.log('Initializing Pyodide');
      let pyodide = await window.loadPyodide();
      await pyodide.loadPackage('numpy');
      await pyodide.loadPackage('matplotlib');
      setState({ ...state, pyodide: pyodide });
      console.log(
        pyodide.runPython(`
            import sys
            sys.version
        `)
      );
    }
    main();
  }, []);

  const onChangePythonSnippet = (event) => {
    setState({ ...state, pythonSnippet: event.target.value });
  };

  const onSubmitPythonSnippet = () => {
    console.log('Running python snippet');
    window.testvar = 1234; // example of reading in a var from javascript side
    if (state.pyodide) {
      state.pyodide
        .runPythonAsync(state.pythonSnippet)
        .then((output) => {
          console.log(output);
          let imgStr = state.pyodide.globals.toJs().get('img') || '';
          setState({ ...state, errorLog: '', b64Image: 'data:image/png;base64, ' + imgStr }); // also clear errors
        })
        .catch((err) => {
          setState({ ...state, errorLog: String(err) });
        });
    }
  };

  return (
    <div>
      <br></br>
      <h4>(Temporary) Playing around with Pyodide:</h4>
      <Form>
        <Form.Group className="mb-3" controlId="formPythonSnippet">
          <Form.Label style={{ display: 'flex' }}>
            Enter Python Snippet, any prints will show up in the browser console<br></br>
          </Form.Label>
          <InputGroup className="mb-3">
            <textarea rows="20" cols="100" onChange={onChangePythonSnippet} value={state.pythonSnippet} />
            &nbsp; &nbsp;
            <Button variant="secondary" onClick={onSubmitPythonSnippet}>
              <FontAwesomeIcon icon={faArrowRight} />
            </Button>
          </InputGroup>
        </Form.Group>
      </Form>
      <div>
        Image of b64 string stored within img variable:<br></br>
        <img src={state.b64Image} alt="image output of python" />
      </div>
      <br></br>
      <div className="display-linebreak">
        Error log: <br></br> {state.errorLog}
      </div>
    </div>
  );
};

export default Pyodide;
