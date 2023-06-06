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
  const metadatas = getDataSourceMeta(queryClient, type, account, container);
  const [directoryNode, setDirectoryNode] = useState<DirectoryNode>(null);
  useEffect(() => {
    if (metadatas.data && metadatas.data.length > 0) {
      const dataRoot = groupDataByDirectories(metadatas.data);
      setDirectoryNode(dataRoot);
    }
  }, [metadatas.data]);

  return (
    <div className="container md:mx-auto flex justify-center">
      {!metadatas.isFetched ? (
        <div>
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
          <div className="flex justify-items-stretch">
            <table>
              <thead>
                <tr>
                  <th className="text-start">Spectrogram Thumbnail</th>
                  <th className="text-start">Recording Name</th>
                  <th className="text-start">Length in Samples</th>
                  <th className="text-start">
                    Length in Seconds Data Type
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
                  <th className="text-start">Frequency</th>
                  <th className="text-start">Sample Rate</th>
                  <th className="text-start">Number of Annotations</th>
                  <th className="text-start">Author</th>
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
