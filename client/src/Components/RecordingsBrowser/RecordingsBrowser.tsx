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
    <div className="container md:mx-auto flex">
      {!metadatas.isFetched ? (
        <div className="justify-center">
          <svg
            className="animate-spin ml-1 mr-3 h-2/5 w-2/5 text-white"
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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="focus:outline-none h-12 border-b-2 border-accent ">
                  <th className="s:w-1/5 w-70">Spectrogram Thumbnail</th>
                  <th className="w-64">Recording Name</th>
                  <th className="w-16">Length in Samples</th>
                  <th>
                    Data Type{' '}
                    <a
                      style={{ textDecoration: 'none', color: 'white', margin: '5px 0 0 5px' }}
                      target="_blank"
                      rel="noreferrer"
                      href="https://pysdr.org/content/iq_files.html#binary-files"
                    >
                      <InfoOutlinedIcon></InfoOutlinedIcon>
                    </a>
                  </th>
                  <th>Frequency</th>
                  <th className="w-20">Sample Rate</th>
                  <th>Number of Annotations</th>
                  <th style={{ width: '10%' }}>Author</th>
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
