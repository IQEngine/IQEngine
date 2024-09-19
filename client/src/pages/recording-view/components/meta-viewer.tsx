import React from 'react';
import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { unitPrefixHz } from '@/utils/rf-functions';

export interface MetaViewerProps {
  meta: SigMFMetadata;
}

export const MetaViewer = ({ meta }: MetaViewerProps) => {
  if (!meta) return <></>;
  return (
    <div className="flex justify-evenly border border-primary p-2 gap-2">
      <div className="flex-col">
        <div className="text-primary mr-2 text-sm">data type:</div>
        <div className="text-base-content text-sm">{meta.getDataType()}</div>
      </div>
      <div className="flex-col">
        <div className="text-primary mr-2 text-sm">sample rate:</div>
        <div className="text-base-content text-sm">
          {unitPrefixHz(meta.getSampleRate()).freq} {unitPrefixHz(meta.getSampleRate()).unit}
        </div>
      </div>
      <div className="flex-col">
        <div className="text-primary mr-2 text-sm">file name:</div>
        <div className="text-base-content text-sm">{meta.getFileName()}</div>
      </div>
      <div className="flex-col">
        <div className="text-primary mr-2 text-sm">description:</div>
        <div className="text-base-content text-sm">{meta.getDescription()}</div>
      </div>
    </div>
  );
};

export default MetaViewer;
