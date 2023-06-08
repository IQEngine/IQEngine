// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { directoryOpen, fileOpen, supported } from 'browser-fs-access';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';
import { getDataSource } from '@/api/datasource/Queries';
import { CLIENT_TYPE_LOCAL } from '@/api/Models';
import { setLocalClient } from '@/Store/Reducers/LocalClientReducer';

const LocalFileBrowser = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [container, setContainer] = useState<string>(null);
  const [enabled, setEnabled] = useState(false);
  const [filePath, setFilePath] = useState('');
  const dataSourceQuery = getDataSource(CLIENT_TYPE_LOCAL, 'local', container, enabled);

  useEffect(() => {
    if (dataSourceQuery.data) {
      if (filePath !== '') {
        const spectogramLink = `/spectrogram/${CLIENT_TYPE_LOCAL}/${dataSourceQuery.data.account}/${
          dataSourceQuery.data.container
        }/${encodeURIComponent(filePath)}`;
        navigate(spectogramLink);
      } else {
        navigate(`/recordings/${CLIENT_TYPE_LOCAL}/${dataSourceQuery.data.account}/${dataSourceQuery.data.container}`);
      }
    }
  }, [dataSourceQuery.data]);

  const directoryPickerAvailable = supported; // not all browsers support it yet

  const openFile = async () => {
    const files = await fileOpen({
      multiple: true,
      extensions: ['.sigmf-meta', '.sigmf-data'],
    });
    let fileWithoutExtrension = files[0].webkitRelativePath.replace('.sigmf-meta', '').replace('.sigmf-data', '');
    setFilePath(fileWithoutExtrension);
    dispatch(setLocalClient(files));
    setEnabled(true);
  };

  const openDir = async () => {
    const dirHandle = (await directoryOpen({
      recursive: true,
    })) as FileWithDirectoryAndFileHandle[];
    if (dirHandle.length === 0) {
      return;
    }
    let container = dirHandle[0].webkitRelativePath.split('/')[0];
    setContainer(container);
    dispatch(setLocalClient(dirHandle));
    setEnabled(true);
  };

  return (
    <div className="repocard">
      <h2 className="repocardheader">Browse Local Files</h2>
      <div className="repocardbody">
        <div className="grid justify-items-center mt-12 space-y-4">
          {directoryPickerAvailable && (
            <>
              <button onClick={openDir}>Open Local Directory</button>
              <p>OR</p>
            </>
          )}
          <button onClick={openFile}>
            Select 1 .sigmf-meta
            <br />
            and 1 .sigmf-data
          </button>
          <div className="text-secondary text-center">
            Note: FFTs and visualizations are done client-side (the data won't be uploaded anywhere)
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalFileBrowser;
