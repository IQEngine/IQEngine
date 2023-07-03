import React from 'react';
import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { getFrequency } from '@/utils/rfFunctions';

export interface MetaViewerProps {
  meta: SigMFMetadata;
}

export const MetaViewer = ({ meta }: MetaViewerProps) => {
  if (!meta) return <></>;
  return (
    <div className="border border-primary ml-3 mt-2">
      <div className="flex mt-3 mb-3 stats shadow">
        <div className="stat place-items-center">
          <div className="stat-title">data type</div>
          <div className="stat-value">{meta.getDataType()}</div>
        </div>
        <div className="stat place-items-center">
          <div className="stat-title">offset</div>
          <div className="stat-value">{meta.getOffset()}</div>
        </div>
        <div className="stat place-items-center">
          <div className="stat-title">sample rate</div>
          <div className="stat-value">
            {getFrequency(meta.getSampleRate()).freq} {getFrequency(meta.getSampleRate()).unit}
          </div>
        </div>
        <div className="stat place-items-center">
          <div className="stat-title">version</div>
          <div className="stat-value">{meta.getVersion()}</div>
        </div>
        <div className="stat place-items-center">
          <div className="stat-title">description</div>
          <div className="tooltip" data-tip={meta.getDescription()}>
            <div className="stat-desc text-white">{meta.getShortDescription()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetaViewer;
