// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';

export default function FileRow({
  item,
  updateConnectionMetaFileHandle,
  updateConnectionDataFileHandle,
  updateConnectionRecording,
  updateConnectionBlobClient,
  updateBlobTotalIQSamples,
}) {
  const [modal, setModal] = useState(false);
  const toggle = () => {
    setModal(!modal);
  };

  const annotationsData = item.annotations.map((item, index) => {
    const deepItemCopy = JSON.parse(JSON.stringify(item));
    delete deepItemCopy['core:sample_start'];
    delete deepItemCopy['core:sample_count'];
    delete deepItemCopy['core:freq_lower_edge'];
    delete deepItemCopy['core:freq_upper_edge'];
    delete deepItemCopy['core:description'];

    return (
      <tr key={index}>
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
    <tr style={{ textAlign: 'center' }}>
      {/* If we are looking at a recording from blob storage */}
      {!item.dataFileHandle ? (
        <>
          <td>
            <Link
              to={'spectrogram/' + item.name.replace('.sigmf-meta', '')}
              onClick={() => {
                updateConnectionMetaFileHandle(item.metaFileHandle);
                updateConnectionDataFileHandle(item.dataFileHandle);
                updateConnectionRecording(item.name.replace('.sigmf-meta', ''));
                updateConnectionBlobClient(item.dataClient);
                updateBlobTotalIQSamples(item.lengthInIQSamples);
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
                updateConnectionMetaFileHandle(item.metaFileHandle);
                updateConnectionDataFileHandle(item.dataFileHandle);
                updateConnectionRecording(item.name.replace('.sigmf-meta', ''));
                updateConnectionBlobClient(item.dataClient);
                updateBlobTotalIQSamples(item.lengthInIQSamples);
              }}
            >
              <h5>{item.name.split('(slash)').slice(-1)[0].replace('.sigmf-meta', '')}</h5>
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
                updateConnectionMetaFileHandle(item.metaFileHandle);
                updateConnectionDataFileHandle(item.dataFileHandle);
                updateConnectionRecording(item.name.replace('.sigmf-meta', ''));
                updateConnectionBlobClient(item.dataClient);
                updateBlobTotalIQSamples(item.lengthInIQSamples);
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
          <Button type="button" variant="secondary" style={{ marginBottom: '7px' }} onClick={toggle}>
            {item.numberOfAnnotation}
          </Button>
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
