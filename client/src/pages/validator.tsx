// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState } from 'react';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import CodeMirror from '@uiw/react-codemirror';
import { INITIAL_METADATA_SNIPPET } from '@/utils/constants';
import { metadataValidator } from '@/utils/validators';
import { langs } from '@uiw/codemirror-extensions-langs';

export const Validator = () => {
  const [metadata, setMetadata] = useState(INITIAL_METADATA_SNIPPET);
  const [errors, setErrors] = useState([]);
  const [additionalProperties, setAdditionalProperties] = useState(true);

  const onChangeHandler = (metadataValue) => {
    const metadataRet = metadataValidator(metadataValue, null, additionalProperties);
    setMetadata(metadataRet.metadata);
    setErrors(metadataRet.errors);
  };

  const onChangeAdditionalProperties = (e) => {
    setAdditionalProperties(e.target.checked);
    const metadataRet = metadataValidator(metadata, null, e.target.checked);
    setMetadata(metadataRet.metadata);
    setErrors(metadataRet.errors);
  };

  return (
    <div>
      <div className="grid place-items-center pb-12">
        <div className="p-4">
          <span className="text-primary text-xl align-top">Allow Additional Properties</span>
          <input
            type="checkbox"
            className="toggle toggle-primary ml-2"
            checked={additionalProperties}
            onChange={(e) => {
              onChangeAdditionalProperties(e);
            }}
          />
          <br></br>
          <span className="text-primary text-md align-top">
            (SigMF does allow them, but for catching typos it is useful to disallow)
          </span>
        </div>

        <CodeMirror
          aria-label="Validator Code Editor"
          value={metadata}
          height="500px"
          width="700px"
          onChange={onChangeHandler}
          theme={vscodeDark}
          readOnly={false}
          extensions={[langs.json()]}
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
            <ul aria-label="Validator Errors" style={{ width: '700px' }}>
              {errors.map((error, i) => (
                <li key={'error ' + i}>
                  <svg
                    className="w-4 h-4 mr-1.5 text-error flex-shrink-0 inline-block"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
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
};

export default Validator;
