// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState } from 'react';
import { useEffect } from 'react';
import { getDataSources } from '@/api/datasource/queries';
import { CLIENT_TYPE_API, CLIENT_TYPE_LOCAL } from '@/api/Models';
import { useUserSettings } from '@/api/user-settings/use-user-settings';
import Directory from './directory';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useQueryDataSourceMetaPaths } from '@/api/metadata/queries';
import { DirectoryNode, groupDataByDirectories } from './directory-node';
import { directoryOpen, fileOpen, supported } from 'browser-fs-access';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { getDataSource } from '@/api/datasource/queries';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';

export const Browser = () => {
  const apiDataSources = getDataSources(CLIENT_TYPE_API);
  const [currentType, setCurrentType] = useState(CLIENT_TYPE_API);
  const [currentContainer, setCurrentContainer] = useState('iqengine');
  const [currentAccount, setCurrentAccount] = useState('gnuradio');
  const [currentSas, setCurrentSas] = useState('gnuradio');
  const metadataCollection = useQueryDataSourceMetaPaths(currentType, currentAccount, currentContainer);
  const [directoryNode, setDirectoryNode] = useState<DirectoryNode>(null);
  const navigate = useNavigate();
  const [goToPage, setGoToPage] = useState(false);
  const { setFiles } = useUserSettings();
  const [filePath, setFilePath] = useState<string>(null);
  const localDataSourceQuery = getDataSource(
    CLIENT_TYPE_LOCAL,
    'local',
    currentContainer,
    !!currentContainer || !!filePath
  );

  useEffect(() => {
    if (localDataSourceQuery.data && localDataSourceQuery.data.container === currentContainer && goToPage) {
      if (filePath) {
        const spectogramLink = `/view/${CLIENT_TYPE_LOCAL}/local/single_file/${encodeURIComponent(filePath)}`;
        navigate(spectogramLink);
      } else {
        setCurrentType(CLIENT_TYPE_LOCAL);
        setCurrentAccount(localDataSourceQuery.data.account);
        setCurrentContainer(localDataSourceQuery.data.container);
        setCurrentSas(null);
        console.log('Switching to a local dir');
      }
    }
  }, [localDataSourceQuery.data, currentContainer, filePath, goToPage]);

  async function handleOnClick(container, account, sas) {
    setCurrentType(CLIENT_TYPE_API);
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

  const openFile = async () => {
    console.log('opening local file');
    const files = await fileOpen({
      multiple: true,
    });
    console.log('files', files);
    if (files.length != 2) {
      toast('Please select 1 .sigmf-meta and 1 .sigmf-data file (matching)');
      return;
    }
    let fileWithoutExtension = files[0].name.replace('.sigmf-meta', '').replace('.sigmf-data', '');
    setFiles(files);
    setFilePath(fileWithoutExtension);
    setGoToPage(true);
  };

  const openDir = async () => {
    console.log('opening local directory');
    const dirHandle = (await directoryOpen({
      recursive: true,
    })) as FileWithDirectoryAndFileHandle[];
    if (dirHandle.length === 0) {
      return;
    }
    let containerPath = dirHandle[0].webkitRelativePath.split('/')[0];
    setFiles(dirHandle);
    setCurrentContainer(containerPath);
    setGoToPage(true);
  };

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

            {supported && (
              <div
                className="gap-2 w-48 h-12 items-center p-0 m-0 outline outline-1 outline-primary rounded-lg hover:bg-accent hover:bg-opacity-50"
                id={'local-dir'}
                onClick={openDir}
                aria-label={'local directory'}
                key={'localdir'}
              >
                <h2 className="pl-12 pr-0 pt-3 m-0 leading-tight">Local Directory</h2>
              </div>
            )}

            <div
              className="gap-2 w-48 h-12 items-center p-0 m-0 outline outline-1 outline-primary rounded-lg hover:bg-accent hover:bg-opacity-50"
              id={'local-files'}
              onClick={openFile}
              aria-label={'local files'}
              key={'localfiles'}
            >
              <h2 className="pl-12 pr-0 pt-3 m-0 leading-tight ">Local File Pair</h2>
            </div>
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
                          type={currentType}
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
