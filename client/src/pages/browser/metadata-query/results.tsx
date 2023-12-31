import React from 'react';
import { useQueryMeta } from '@/api/datasource/queries';
import FileRow from '@/pages/browser/file-row';
import { CLIENT_TYPE_API } from '@/api/Models';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export const Results = ({ queryString, geoSelected, handleToggleTrack }) => {
  if (!queryString) return null;
  const { isLoading, data } = useQueryMeta(CLIENT_TYPE_API, queryString);

  const renderResults = () => {
    if (!data) return;
    return data.map((item, i) => {
      return (
        <FileRow
          key={i}
          trackToggle={handleToggleTrack}
          geoSelected={geoSelected}
          filepath={item.file_path}
          account={item.account}
          container={item.container}
          type={item.type}
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
      <div className="flex justify-items-stretch text-start">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-2">Spectrogram Thumbnail</th>
              <th className="p-2">Recording Name</th>
              <th className="p-2">Length in Samples</th>
              <th className="p-2">
                Data Type
                <a
                  style={{ textDecoration: 'none', color: 'white' }}
                  className="mr-2"
                  target="_blank"
                  rel="noreferrer"
                  href="https://pysdr.org/content/iq_files.html#binary-files"
                >
                  <InfoOutlinedIcon></InfoOutlinedIcon>
                </a>
              </th>
              <th className="p-2">Frequency</th>
              <th className="p-2">Sample Rate</th>
              <th className="p-2">Number of Annotations</th>
              <th className="p-2">Author</th>
            </tr>
          </thead>
          <tbody>{renderResults()}</tbody>
        </table>
      </div>
    </div>
  );
};

export default Results;
