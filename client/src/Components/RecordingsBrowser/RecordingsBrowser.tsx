// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useEffect, useState } from 'react';
import Directory from './Directory';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useParams } from 'react-router-dom';
import { getDataSourceMeta } from '@/api/metadata/Queries';
import { DirectoryNode, groupDataByDirectories } from './DirectoryNode';
import { useQueryClient } from '@tanstack/react-query';

export default function RecordingsBrowser() {
  const { type, account, container, sasToken } = useParams();
  const queryClient = useQueryClient();
  const metadata_collection = getDataSourceMeta(queryClient, type, account, container);
  const [directoryNode, setDirectoryNode] = useState<DirectoryNode>(null);
  useEffect(() => {
    if (metadata_collection.data && metadata_collection.data.length > 0) {
      const dataRoot = groupDataByDirectories(metadata_collection.data);
      setDirectoryNode(dataRoot);
    }
  }, [metadata_collection.data]);

  return (
    <div>
      {!metadata_collection.isFetched ? (
        <div className="flex justify-center">
          <svg
            className="animate-spin ml-1 mr-3 w-96 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1"></circle>
            <circle className="percent fifty stroke-current text-primary" cx="12" cy="12" r="10" pathLength="100" />
          </svg>
        </div>
      ) : (
        <div className="md:px-8 xl:px-10">
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
              <tbody>
                {directoryNode && (
                  <Directory
                    key={Math.random()}
                    directory={directoryNode}
                    setExpanded={(name) => '/'}
                    isExpanded={directoryNode.name == '/'}
                  />
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
