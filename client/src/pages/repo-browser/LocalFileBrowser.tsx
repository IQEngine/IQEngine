// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { directoryOpen, fileOpen, supported } from 'browser-fs-access';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';
import { getDataSource } from '@/api/datasource/Queries';
import { CLIENT_TYPE_LOCAL } from '@/api/Models';
import { useUserSettings } from '@/api/user-settings/use-user-settings';


const LocalFileBrowser = () => {
  const navigate = useNavigate();
  const { setFiles } = useUserSettings();
  const [container, setContainer] = useState<string>(null);
  const [filePath, setFilePath] = useState<string>(null);
  const dataSourceQuery = getDataSource(CLIENT_TYPE_LOCAL, 'local', container, !!container || !!filePath);

  useEffect(() => {
    console.debug('dataSourceQuery', dataSourceQuery.data, 'container', container, 'filePath', filePath);
    if (dataSourceQuery.data && dataSourceQuery.data.container === container) {
      if (filePath) {
        const spectogramLink = `/spectrogram/${CLIENT_TYPE_LOCAL}/local/single_file/${encodeURIComponent(filePath)}`;
        navigate(spectogramLink);
      } else {
        navigate(`/recordings/${CLIENT_TYPE_LOCAL}/${dataSourceQuery.data.account}/${dataSourceQuery.data.container}`);
      }
    }
  }, [dataSourceQuery.data, container, filePath]);

  const directoryPickerAvailable = supported; // not all browsers support it yet

  const openFile = async () => {
    console.log('opening local file');
    const files = await fileOpen({
      multiple: true,
    });
    console.log('files', files);
    let fileWithoutExtrension = files[0].name.replace('.sigmf-meta', '').replace('.sigmf-data', '');
    setFiles(files);
    setFilePath(fileWithoutExtrension);
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
    setContainer(containerPath);
  };

  return (
    <div className="repocard">
      <figure>
        <img className="repoimage" src="/local_file.jpeg" alt="Local file browser tile" />
      </figure>
      <div className="repocardbody">
        <h2>Local File Browser</h2>
        <div>Choose from opening a local directory OR from a local SigMF metadata & raw IQ file</div>
        <span className="text-secondary">
          Note: FFTs and visualizations are performed client-side (the data won't be uploaded anywhere)
        </span>
        <div className="card-actions mt-2 justify-center">
          {directoryPickerAvailable && (
            <button className="btn btn-primary opacity-75" onClick={openDir}>
              local folder
            </button>
          )}
          <button className="btn btn-primary opacity-75" onClick={openFile}>
            local files
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocalFileBrowser;
