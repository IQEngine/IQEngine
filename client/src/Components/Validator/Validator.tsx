// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useEffect, useRef, useState } from 'react';
import Ajv from 'ajv';
import sigmfSchema from '@/Components/Validator/sigmf-schema.json';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';

export default function Validator() {
  const [metadata, setMetadata] = useState(`{
    "global": {
        "core:datatype": "cf32_le",
        "core:sample_rate": 1000000,
        "core:hw": "PlutoSDR with 915 MHz whip antenna",
        "core:author": "Art Vandelay",
        "core:version": "1.0.0"
    },
    "captures": [
        {
            "core:sample_start": 0,
            "core:frequency": 915000000
        }
    ],
    "annotations": []
}`);
  const [errors, setErrors] = useState([]);
  const ajv = new Ajv({ strict: false, allErrors: true });

  const onChangeHandler = (metadataValue) => {
    try {
      setMetadata(metadataValue);
      const metadataJSON = JSON.parse(metadataValue);

      const validate = ajv.compile(sigmfSchema);
      const valid = validate(metadataJSON);

      if (valid) {
        setErrors([]);
      } else {
        setErrors(validate.errors);
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        setErrors([{ message: 'Syntax Error: ' + e.message }]);
      } else {
        setErrors([{ message: 'Error' + e.message }]);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-center">
        <CodeMirror
          value={metadata}
          height="500px"
          width="700px"
          extensions={[json()]}
          onChange={onChangeHandler}
          theme={vscodeDark}
          readOnly={false}
        />
      </div>
      {errors.length > 0 && (
        <div>
          <div className="flex justify-center">
            <h2 className="text-error" style={{ width: '700px' }}>
              Errors
            </h2>
          </div>
          <div className="flex justify-center text-error">
            <ul style={{ width: '700px' }}>
              {errors.map((error, i) => (
                <li key={'error ' + { i }}>
                  <svg
                    className="w-4 h-4 mr-1.5 text-error flex-shrink-0 inline-block"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  {error.message} {error.instancePath ? ' inside ' + error.instancePath : ''}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
