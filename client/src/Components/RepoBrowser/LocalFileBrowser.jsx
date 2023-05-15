// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import parseMeta from '../../Utils/parseMeta';

function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function handleDirectoryEntry(handle, out, dir) {
  for await (const entry of handle.values()) {
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      if (file.name.split('.').pop() === 'sigmf-meta') {
        // Find the .sigmf-data file to go along with this meta file, and if not found then dont add the meta file
        for await (const val of handle.values()) {
          // FIXME: there might be a bug here when there are multiple files of the same name in diff directories...
          if (val.name === file.name.replace('sigmf-meta', 'sigmf-data')) {
            const json_string = await readFileAsync(file); // grab the metafile text
            out.push(parseMeta(json_string, 'local/', dir + file.name, entry, val));
          }
        }
      }
    }
    if (entry.kind === 'directory') {
      const newHandle = await handle.getDirectoryHandle(entry.name, { create: false });
      await handleDirectoryEntry(newHandle, out, dir + entry.name + '/');
    }
  }
  return out;
}

const LocalFileBrowser = (props) => {
  const navigate = useNavigate();

  const directoryPickerAvailable = typeof window.showDirectoryPicker !== 'undefined'; // not all browsers support it yet

  const openFile = async () => {
    const [handle1, handle2] = await window.showOpenFilePicker({ multiple: true });
    const file1 = await handle1.getFile();
    if (file1.name.includes('.sigmf-meta')) {
      props.updateConnectionMetaFileHandle(handle1); // store it in redux
      props.updateConnectionDataFileHandle(handle2); // assume other file is data
    } else {
      props.updateConnectionMetaFileHandle(handle2);
      props.updateConnectionDataFileHandle(handle1);
    }
    navigate('/recordings/spectrogram/localfile'); // dont include filename so that it wont get included in google analytics
  };

  const openDir = async () => {
    const dirHandle = await window.showDirectoryPicker();
    const entries = await handleDirectoryEntry(dirHandle, [], '');
    //console.log(entries);
    props.fetchRecordingsList({ entries: entries });
    navigate('/recordings');
  };

  const styleMargin = {
    marginTop: 30,
    marginBottom: 30,
    minWidth: '90%',
  };

  return (
    // <div className="container-fluid col-4">
    <Card className="flexOne">
      <Card.Header>Browse Local Files</Card.Header>
      <Card.Body className="cardBodyCenter">
        <center>
          {directoryPickerAvailable && (
            <>
              <Button onClick={openDir} style={styleMargin} variant="success">
                Open Local Directory
              </Button>
              <br />
              OR
            </>
          )}
          <br />
          <Button onClick={openFile} style={styleMargin} variant="success">
            Select 1 .sigmf-meta
            <br />
            and 1 .sigmf-data
          </Button>
          <div style={{ color: 'grey' }}>
            Note: FFTs and visualizations are done client-side (the data won't be uploaded anywhere)
          </div>
        </center>
      </Card.Body>
    </Card>
  );
};

export default LocalFileBrowser;
