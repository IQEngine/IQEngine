import React from 'react';
import { queryMeta } from '@/api/metadata/queries';
import FileRow from '@/pages/recordings-browser/File';

export const Results = ({ queryString }) => {
  if (!queryString) return null;
  const { isLoading, data } = queryMeta(queryString);

  const renderResults = () => {
    if (!data) return;
    return data.map((item, i) => {
      const origin = item.getOrigin();
      return (
        <FileRow
          key={i}
          filepath={origin.file_path}
          account={origin.account}
          container={origin.container}
          type={origin.type}
        />
      );
    });
  };
  return (
    <div>
      {isLoading && (
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
      <div className="flex justify-center	mt-10">
        <div className="grid grid-cols-1 gap-4">{renderResults()}</div>
      </div>
    </div>
  );
};

export default Results;
