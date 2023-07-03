import React, { useCallback, useEffect } from 'react';
import { ArrowDownTrayIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { useGetMetadataFeatures, useUpdateMeta } from '@/api/metadata/Queries';
import toast from 'react-hot-toast';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import CodeMirror from '@uiw/react-codemirror';
import { langs } from '@uiw/codemirror-extensions-langs';

export interface MetaRawProps {
  meta: SigMFMetadata;
}

export const MetaRaw = ({ meta }: MetaRawProps) => {
  const updateMeta = useUpdateMeta(meta);
  const { canUpdateMeta } = useGetMetadataFeatures(meta.getOrigin().type);

  const downloadInfo = () => {
    const fileData = meta.getSigMFRaw();
    const blob = new Blob([fileData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'spectrogram-meta-data-modified.sigmf-meta';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    setTimeout(function () {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 0);
  };

  const saveMeta = useCallback(() => {
    updateMeta.mutate(meta, {
      onSuccess: () => {
        toast('Successfully updated metadata', {
          icon: '👍',
          className: 'bg-green-100 font-bold',
        });
      },
      onError: (response) => {
        toast('Something went wrong updating metadata', {
          icon: '😖',
          className: 'bg-red-100 font-bold',
        });
      },
    });
  }, [meta]);

  return (
    <div className="outline outline-1 outline-primary p-2">
      <div className="flex flex-row">
        <button
          aria-label="Download Metadata Button"
          className="mb-1 text-right"
          onClick={() => {
            downloadInfo();
          }}
        >
          <ArrowDownTrayIcon className="inline-block mr-2 h-6 w-6" />
          Download meta JSON
        </button>
        {canUpdateMeta && (
          <button
            aria-label="Save Metadata Button"
            className="text-right mb-1 ml-1"
            onClick={() => {
              saveMeta();
            }}
          >
            <DocumentCheckIcon className="inline-block mr-2 h-6 w-6" />
            Save latest
          </button>
        )}
      </div>
      <div className="">
        <CodeMirror
          value={meta?.getSigMFRaw()}
          height="500px"
          theme={vscodeDark}
          readOnly={!canUpdateMeta}
          extensions={[langs.json()]}
        />
      </div>
    </div>
  );
};

export default MetaRaw;
