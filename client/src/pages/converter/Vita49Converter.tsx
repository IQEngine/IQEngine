import { useConvertVitaToSigmf } from '@/api/converter/vita49ToSigmf';
import React from 'react';
import fileDownload from 'js-file-download';

export const VitaConverter = () => {
  const [selectedFile, setSelectedFile] = React.useState(null);

  const { refetch, isFetching, data } = useConvertVitaToSigmf(selectedFile);

  const download = () => {
    if (!data) return;
    fileDownload(data, selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) + '.zip');
  };

  return (
    <div style={{ minWidth: '50%' }} className="flex flex-col ">
      {isFetching && (
        <div className="flex justify-center	mt-10">
          <div
            className="mb-10 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status"
          >
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              Loading...
            </span>
          </div>
        </div>
      )}

      {!isFetching && !data && (
        <>
          <label className="mb-2 inline-block text-neutral-200">Select .vita49 file</label>
          <input
            className="
              mb-2 w-full min-w-0 flex-auto rounded border border-solid border-primary bg-clip-padding px-3 py-[0.32rem] text-base font-normal text-neutral-200
              file:-mx-3
              file:-my-[0.32rem]
              file:overflow-hidden
              file:rounded-none
              file:border-solid
              file:border-primary
              hover:file:border-accent
              file:px-3
              file:py-[0.32rem]
              file:[border-inline-end-width:1px]
              file:[margin-inline-end:0.75rem]
              file:bg-primary
              hover:file:bg-accent
              hover:border-accent
          "
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            accept=".vita49"
            max={1}
            id={'file-chooser-button'}
          />

          <div className="flex justify-center">
            <button id="convert-button" disabled={!selectedFile} onClick={() => refetch()}>
              Convert
            </button>
          </div>
        </>
      )}

      {data && (
        <>
          <p className="text-lg mb-2">
            Converting was successful. Click the button below to download the SigMF Dataset.
          </p>
          <div className="flex justify-center">
            <button id="download-button" onClick={() => download()}>
              Download
            </button>
          </div>
        </>
      )}
    </div>
  );
};
