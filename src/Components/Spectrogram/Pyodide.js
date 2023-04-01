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
    pythonSnippet: '',
    pyodide: null,
  });

  useEffect(() => {
    async function main() {
      console.log('Initializing Pyodide');
      let pyodide = await window.loadPyodide();
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
    if (state.pyodide) {
      state.pyodide.runPython(state.pythonSnippet);
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
            <textarea rows="10" cols="100" onChange={onChangePythonSnippet} value={state.pythonSnippet} />
            &nbsp; &nbsp;
            <Button variant="secondary" onClick={onSubmitPythonSnippet}>
              <FontAwesomeIcon icon={faArrowRight} />
            </Button>
          </InputGroup>
        </Form.Group>
      </Form>
    </div>
  );
};

export default Pyodide;
