import React from 'react';
import { WavConverter } from './wavConverter';

export const Converter = () => {
  const fileTypes = ['Select file type', '.wav'];
  const [selectedFileType, setSelectedFileType] = React.useState('');

  return (
    <>
      <h1 className="text-primary text-2xl mb-3 text-center">SigMF Converter</h1>
      <div className="container mx-auto px-4 flex justify-center">
        <div className="grid grid-cols-2 gap-x-10 gap-y-4">
          <div>
            <p className="text-lg">
              SigMF Converter is an online file converter designed to convert various file formats to the SigMF format.
              To get started, simply select the file format and upload a file, the converter will take care of the rest.
              <br />
              <br />
              If you would like to run the converter straight from Python locally, see{' '}
              <a href="https://github.com/IQEngine/IQEngine/blob/speed-up-wav-converter/api/converters/README.md">
                these steps
              </a>
              .
            </p>
          </div>
          <div className="flex items-center">
            <span className="mr-2">convert</span>
            <select
              className="select select-bordered w-full max-w-xs text-base border"
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value)}
            >
              {fileTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <span className="ml-2">to SigMF</span>
          </div>
          <div className="row-start-2 col-span-2 flex justify-center ">
            {selectedFileType === '.wav' && <WavConverter />}
          </div>
        </div>
      </div>
    </>
  );
};
