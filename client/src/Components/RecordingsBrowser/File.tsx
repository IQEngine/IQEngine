// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/Store/hooks';
import { TILE_SIZE_IN_IQ_SAMPLES, MAX_SIMULTANEOUS_FETCHES } from '../../Utils/constants';

import {
  updateConnectionMetaFileHandle,
  updateConnectionDataFileHandle,
  updateConnectionRecording,
  updateConnectionBlobClient,
} from '@/Store/Reducers/ConnectionReducer';
import { updateBlobTotalIQSamples } from '../../Store/Reducers/BlobReducer';

import { fetchMoreData } from '@/Store/Reducers/BlobReducer';

export default function FileRow({ item }) {
  const dispatch = useAppDispatch();
  const [modal, setModal] = useState(false);
  const connection = useAppSelector((state) => state.connection);
  const blob = useAppSelector((state) => state.blob);
  const toggle = () => {
    setModal(!modal);
  };
  function dispatchUpdatesBeforeMoving(item) {
    dispatch(updateConnectionMetaFileHandle(item.metaFileHandle));
    dispatch(updateConnectionDataFileHandle(item.dataFileHandle));
    dispatch(updateConnectionRecording(item.name.replace('.sigmf-meta', '')));
    dispatch(updateConnectionBlobClient(item.dataClient));
    dispatch(updateBlobTotalIQSamples(item.lengthInIQSamples));
    // copy connection to guaranteee using the new resources
    const connection_copy = { ...connection };
    connection_copy.metafilehandle = item.metaFileHandle;
    connection_copy.datafilehandle = item.dataFileHandle;
    connection_copy.recording = item.name.replace('.sigmf-meta', '');
    connection_copy.blobClient = item.dataClient;
    for (let i = 0; i < 4; i++) {
      dispatch(
        fetchMoreData({
          tile: i,
          connection: connection_copy,
          blob: blob,
          dataType: item.coreDataType,
          offset: i * TILE_SIZE_IN_IQ_SAMPLES, // in IQ samples
          count: TILE_SIZE_IN_IQ_SAMPLES, // in IQ samples
          pyodide: null,
        })
      );
    }
  }
  const annotationsData = item.annotations.map((item, index) => {
    const deepItemCopy = JSON.parse(JSON.stringify(item));
    delete deepItemCopy['core:sample_start'];
    delete deepItemCopy['core:sample_count'];
    delete deepItemCopy['core:freq_lower_edge'];
    delete deepItemCopy['core:freq_upper_edge'];
    delete deepItemCopy['core:description'];

    return (
      <tr key={index} className="border-iqengine-secondary border-2">
        <td>{item['core:sample_start']}</td>
        <td>{item['core:sample_count']}</td>
        <td>{item['core:freq_lower_edge'] / 1e6}</td>
        <td>{item['core:freq_upper_edge'] / 1e6}</td>
        <td>{item['core:description']}</td>
        <td>{JSON.stringify(deepItemCopy, null, 4).replaceAll('{', '').replaceAll('}', '').replaceAll('"', '')}</td>
      </tr>
    );
  });

  function NewlineText(props) {
    const text = props.text;
    return <div className="datatypetext">{text}</div>;
  }

  return (
    <tr style={{ textAlign: 'center' }} className="border-iqengine-secondary border-2">
      {/* If we are looking at a recording from blob storage */}
      {!item.dataFileHandle ? (
        <>
          <td>
            <Link
              to={'spectrogram/' + item.name.replace('.sigmf-meta', '')}
              onClick={() => {
                dispatchUpdatesBeforeMoving(item);
              }}
            >
              <div className="zoom">
                <img src={item.thumbnailUrl} alt="Spectrogram Thumbnail" style={{ width: '200px', height: '100px' }} />
              </div>
            </Link>
          </td>
          <td className="align-middle" style={{ textAlign: 'left' }}>
            <Link
              to={'spectrogram/' + item.name.replace('.sigmf-meta', '')}
              onClick={() => {
                dispatchUpdatesBeforeMoving(item);
              }}
            >
              <h2>{item.name.split('(slash)').slice(-1)[0].replace('.sigmf-meta', '')}</h2>
            </Link>
            <div title={item.description}>{item.shortDescription}</div>
            {/* File download links */}
            <>
              {'('}download:&nbsp;
              <a href={item.dataUrl}>data</a>
              ,&nbsp;
              <a href={item.metaUrl}>meta</a>
              {')'}
            </>
          </td>
        </>
      ) : (
        // If we are looking at a local recording then hide thumbnail/download links and dont include filename in url so its not included in google analytics
        <>
          <td></td>
          <td className="align-middle" style={{ textAlign: 'left' }}>
            <Link
              to={'spectrogram/localfile'}
              onClick={() => {
                dispatchUpdatesBeforeMoving(item);
              }}
            >
              <h5>{item.name.split('(slash)').slice(-1)[0].replace('.sigmf-meta', '')}</h5>
            </Link>
          </td>
        </>
      )}

      <td className="align-middle">{item.lengthInMillionIQSamples} M</td>
      <td className="align-middle">
        <NewlineText text={item.dataType} />
      </td>
      <td className="align-middle">{item.frequency} MHz</td>
      <td className="align-middle">{item.sampleRate} MHz</td>
      <td className="align-middle">
        <div>
          <button
            className="mb-2 rounded border-2 border-iqengine-secondary p-1 hover:bg-iqengine-secondary hover:text-black"
            onClick={toggle}
          >
            {item.numberOfAnnotation}
          </button>
          <Modal isOpen={modal} toggle={toggle} size="lg">
            <ModalHeader toggle={toggle}>{item.name}</ModalHeader>
            <ModalBody>
              <table className="table">
                <thead>
                  <tr>
                    <th>Sample Start</th>
                    <th>Sample Count</th>
                    <th>Frequency Min [MHz]</th>
                    <th>Frequency Max [MHz]</th>
                    <th>Description</th>
                    <th>Other</th>
                  </tr>
                </thead>
                <tbody>{annotationsData}</tbody>
              </table>
            </ModalBody>
          </Modal>
          <br></br>({item.numberOfCaptures} Capture{item.numberOfCaptures > 1 && 's'})
        </div>
      </td>
      <td className="align-middle">
        {item.author}
        <br></br>
        {item.email}
      </td>
    </tr>
  );
}
