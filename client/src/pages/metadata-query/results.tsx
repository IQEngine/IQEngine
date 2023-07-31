import React from 'react';
import { useQueryMeta } from '@/api/datasource/queries';
import FileRow from '@/pages/recordings-browser/File';
import { CLIENT_TYPE_API } from '@/api/Models';

export const Results = ({ queryString, geoSelected, handleToggleTrack }) => {
  if (!queryString) return null;
  const { isLoading, data } = useQueryMeta(CLIENT_TYPE_API, queryString);

  const renderResults = () => {
    if (!data) return;
    return data.map((item, i) => {
      return (
        <FileRow key={i} trackToggle={handleToggleTrack} queryResult={true} geoSelected={geoSelected} filepath={item.file_path} account={item.account} container={item.container} type={item.type} />
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
        <div className="grid grid-cols-1 gap-1">{renderResults()}</div>
      </div>
    </div>
  );
};

export default Results;
