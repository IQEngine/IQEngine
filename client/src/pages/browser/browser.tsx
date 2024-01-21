import React, { useState } from 'react';
import { useEffect } from 'react';
import { getDataSources, getDataSource } from '@/api/datasource/queries';
import { CLIENT_TYPE_API, CLIENT_TYPE_LOCAL } from '@/api/Models';
import { useUserSettings } from '@/api/user-settings/use-user-settings';
import Directory from './directory';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useQueryDataSourceMetaPaths } from '@/api/metadata/queries';
import { DirectoryNode, groupDataByDirectories } from './directory-node';
import { directoryOpen, fileOpen, supported } from 'browser-fs-access';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';
import SiggenTile from './misc-tiles/siggen-tile';
import ValidatorTile from './misc-tiles/validator-tile';
import WebfftBenchmarkTile from './misc-tiles/webfft-benchmark-tile';
import ConverterTile from './misc-tiles/converter-tile';
import { ModalDialog } from '@/features/ui/modal/Modal';
import { MetadataQuery } from './metadata-query/metadata-query';
import { SmartQuery } from './metadata-query/smart-query';
import { CustomAzureForm } from './custom-azure-form';

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
  const [showModal, setShowModal] = useState(false);
  const [queryActive, setQueryActive] = useState(false);

  const localDataSourceQuery = getDataSource(
    CLIENT_TYPE_LOCAL,
    'local',
    currentContainer,
    !!currentContainer || !!filePath
  );

  useEffect(() => {
    if (
      localDataSourceQuery.data &&
      localDataSourceQuery.data.container === currentContainer &&
      goToPage &&
      currentType === CLIENT_TYPE_LOCAL
    ) {
      if (filePath) {
        const spectogramLink = `/view/${CLIENT_TYPE_LOCAL}/local/single_file/${encodeURIComponent(filePath)}`;
        navigate(spectogramLink);
      } else {
        setCurrentAccount(localDataSourceQuery.data.account);
        setCurrentContainer(localDataSourceQuery.data.container);
        setCurrentSas(null);
        console.log('Switching to a local dir');
      }
    }
  }, [localDataSourceQuery.data, currentContainer, filePath, goToPage, currentType]);

  async function handleOnClick(container, account, sas) {
    setQueryActive(false);
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
    setCurrentType(CLIENT_TYPE_LOCAL);
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
    setQueryActive(false);
    setCurrentType(CLIENT_TYPE_LOCAL);
  };

  return (
    <div className="mb-0 ml-1 mr-0 p-0 pt-3">
      {/* -------Misc Tools------- */}
      <div
        id="misc_tools_button"
        className="absolute right-2 top-12 p-2 mr-2 text-2xl text-primary outline outline-1 outline-primary rounded-lg hover:bg-accent hover:bg-opacity-50"
        onClick={() => {
          setShowModal(true);
        }}
      >
        Misc Tools
      </div>
      {showModal && (
        <ModalDialog setShowModal={setShowModal} heading="" classList="max-w-full">
          <div className="grid sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-10 justify-items-center text-lg text-white">
            <SiggenTile />
            <ValidatorTile />
            <WebfftBenchmarkTile />
            <ConverterTile />
          </div>
        </ModalDialog>
      )}

      <div className="flex w-full">
        {/* -------Repo list------- */}
        <div className="h-fit w-60 sticky top-0 grid gap-4">
          {apiDataSources?.data?.map((item, i) => (
            <div className="group" key={item.name}>
              {/* -------Pop up box------- */}
              <div className="hidden absolute ml-48 group-hover:block">
                <div className="repocard bg-opacity-100">
                  <figure>
                    <img className="repoimage" src={item.imageURL ?? '/api.png'} alt={item.name} />
                  </figure>
                  <div className="repocardbody">
                    <h2>{item.name}</h2>
                    <p>{item.description}</p>
                  </div>
                </div>
              </div>
              {/* -------Actual label------- */}
              <div
                className="grid grid-cols-10 gap-2 w-52 h-12 items-center outline outline-1 outline-primary rounded-lg hover:bg-accent hover:bg-opacity-50"
                id={item.name.replaceAll(' ', '')}
                onClick={() => handleOnClick(item.container, item.account, item.sasToken)}
                aria-label={item.name}
                key={i}
              >
                <div className="col-span-3">
                  <img className="h-12 w-12 rounded-l-lg" src={item.imageURL ?? '/api.png'} alt={item.name} />
                </div>
                <h2 className="col-span-6 m-0 leading-tight">{item.name}</h2>
                {currentContainer === item.container && currentAccount === item.account && !queryActive && (
                  <div className="col-span-1 mb-2 text-4xl text-primary">→</div>
                )}
              </div>
            </div>
          ))}

          <div
            className="grid grid-cols-9 gap-2 w-52 h-12 items-center outline outline-1 outline-primary rounded-lg hover:bg-accent hover:bg-opacity-50"
            id={'query-metadata'}
            onClick={() => setQueryActive(true)}
            aria-label={'query'}
            key={'query'}
          >
            <h2 className="col-span-8 pl-2 m-0 leading-tight ">Query Recordings</h2>
            {queryActive && <div className="col-span-1 mb-2 text-4xl text-primary">→</div>}
          </div>

          {supported && (
            <div
              className="grid grid-cols-9 gap-2 w-52 h-12 items-center outline outline-1 outline-primary rounded-lg hover:bg-accent hover:bg-opacity-50"
              id={'local-dir'}
              onClick={openDir}
              aria-label={'local directory'}
              key={'localdir'}
            >
              <h2 className="col-span-8 pl-2 m-0 leading-tight">Local Directory</h2>
              {currentType === CLIENT_TYPE_LOCAL && !queryActive && (
                <div className="col-span-1 mb-2 text-4xl text-primary">→</div>
              )}
            </div>
          )}

          {!supported && (
            <div className="group">
              <div className="hidden absolute ml-48 group-hover:block">
                <div className="repocard bg-opacity-100">
                  <div className="repocardbody">
                    <p>
                      Not supported in your current browser, use Local File Pair instead.<br></br>
                      <a target="_blank" href="https://caniuse.com/mdn-api_window_showdirectorypicker">
                        Compatibility chart
                      </a>
                    </p>
                  </div>
                </div>
              </div>
              <div
                className="grid grid-cols-9 gap-2 w-52 h-12 items-center outline outline-1 outline-gray-500 rounded-lg "
                id={'local-dir'}
                aria-label={'local directory'}
                key={'localdir'}
              >
                <h2 className="col-span-8 pl-2 m-0 leading-tight text-gray-500">Local Directory</h2>
                {currentType === CLIENT_TYPE_LOCAL && !queryActive && (
                  <div className="col-span-1 mb-2 text-4xl text-primary">→</div>
                )}
              </div>
            </div>
          )}

          <div
            className="gap-2 w-52 h-12 items-center outline outline-1 outline-primary rounded-lg hover:bg-accent hover:bg-opacity-50"
            id={'local-files'}
            onClick={openFile}
            aria-label={'local files'}
            key={'localfiles'}
          >
            <h2 className="pl-2 pt-3 m-0 leading-tight ">Local File Pair</h2>
          </div>

          {/* -------Manually enter azure credentials------- */}
          <CustomAzureForm
            setCurrentContainer={setCurrentContainer}
            setCurrentAccount={setCurrentAccount}
            setCurrentSas={setCurrentSas}
            setCurrentType={setCurrentType}
          />
        </div>
        {queryActive && (
          <div>
            <SmartQuery /> <br></br>
            <MetadataQuery />
          </div>
        )}

        {/* -------Recording list------- */}
        <div className="flex flex-col pl-6">
          <div className="ml-auto col-span-3">
            {!metadataCollection.isFetched && !queryActive && (
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
            )}
            {metadataCollection.isFetched && !queryActive && (
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
