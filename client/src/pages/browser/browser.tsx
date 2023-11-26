// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState } from 'react';
import { useEffect } from 'react';
import { useConfigQuery } from '@/api/config/queries';
import { getDataSources } from '@/api/datasource/queries';
import { CLIENT_TYPE_API, CLIENT_TYPE_BLOB, DataSource } from '@/api/Models';
import { useQueryClient } from '@tanstack/react-query';
import { useFeatureFlags } from '@/hooks/use-feature-flags';
import { useUserSettings } from '@/api/user-settings/use-user-settings';
import Directory from './directory';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useParams } from 'react-router-dom';
import { useQueryDataSourceMetaPaths } from '@/api/metadata/queries';
import { DirectoryNode, groupDataByDirectories } from './directory-node';

export const Browser = () => {
  const apiDataSources = getDataSources(CLIENT_TYPE_API);
  const [currentContainer, setCurrentContainer] = useState('iqengine');
  const [currentAccount, setCurrentAccount] = useState('gnuradio');
  const [currentSas, setCurrentSas] = useState('gnuradio');
  const metadataCollection = useQueryDataSourceMetaPaths(CLIENT_TYPE_API, currentAccount, currentContainer);
  const [directoryNode, setDirectoryNode] = useState<DirectoryNode>(null);

  async function handleOnClick(container, account, sas) {
    setCurrentAccount(account);
    setCurrentContainer(container);
    setCurrentSas(sas);
    console.log('Switching to', container, 'within', account);
  }

  useEffect(() => {
    if (metadataCollection.data && metadataCollection.data.length > 0) {
      const dataRoot = groupDataByDirectories(metadataCollection.data);
      setDirectoryNode(dataRoot);
    }
  }, [metadataCollection.data]);

  return (
    <div className="mb-0 ml-1 mr-0 p-0 pt-3">
      <div className="flex flex-row w-full">
        {/* -------Repo list------- */}
        <div className="w-64 block">
          <div className="grid grid-cols-1 gap-4">
            {apiDataSources?.data?.map((item, i) => (
              <div
                className="grid grid-cols-4 gap-2 w-48 h-12 items-center p-0 m-0 outline outline-1 outline-primary rounded-lg hover:bg-accent hover:bg-opacity-50"
                id={item.name.replaceAll(' ', '')}
                onClick={() => handleOnClick(item.container, item.account, item.sasToken)}
                aria-label={item.name}
                key={i}
              >
                <div>
                  <img className="h-12 rounded-l-lg p-0 m-0" src={item.imageURL ?? '/api.png'} alt={item.name} />
                </div>
                <h2 className="col-span-3 p-0 m-0 leading-tight">{item.name}</h2>
              </div>
            ))}
          </div>
        </div>

        {/* -------Recording list------- */}
        <div className="flex flex-col pl-3">
          <div className="ml-auto col-span-3">
            {!metadataCollection.isFetched ? (
              <div className="flex justify-center">
                <svg
                  className="animate-spin ml-1 mr-3 w-96 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1"></circle>
                  <circle
                    className="percent fifty stroke-current text-primary"
                    cx="12"
                    cy="12"
                    r="10"
                    pathLength="100"
                  />
                </svg>
              </div>
            ) : (
              <div className="">
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
                          type={CLIENT_TYPE_API}
                          account={currentAccount}
                          container={currentContainer}
                          sasToken={currentSas}
                        />
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Browser;
