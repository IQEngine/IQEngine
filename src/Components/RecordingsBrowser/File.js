// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

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
  updateBlobTotalBytes,
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
      <td>
        {/* If we are looking at a local dir then dont display the spectrogram thumbnail */}
        {!item.dataFileHandle && (
          <div className="zoom">
            <img src={item.thumbnailUrl} alt="Spectrogram Thumbnail" style={{ width: '200px', height: '100px' }} />
          </div>
        )}
      </td>
      <td className="align-middle" style={{ textAlign: 'left' }}>
        <Link
          to={'spectrogram/' + item.name.replace('.sigmf-meta', '')}
          onClick={() => {
            updateConnectionMetaFileHandle(item.metaFileHandle);
            updateConnectionDataFileHandle(item.dataFileHandle);
            updateConnectionRecording(item.name.replace('.sigmf-meta', ''));
            updateConnectionBlobClient(item.dataClient);
            updateBlobTotalBytes(item.lengthInBytes);
          }}
        >
          <h5>{item.name.replaceAll('(slash)', '/').replace('.sigmf-meta', '')}</h5>
        </Link>
        {/* File download links */}
        {!item.dataFileHandle && (
          <>
            {'('}download:&nbsp;
            <a href={item.dataUrl}>data</a>
            ,&nbsp;
            <a href={item.metaUrl}>meta</a>
            {')'}
          </>
        )}
      </td>
      <td className="align-middle">{item.lengthInIQSamples / 1e6} M</td>
      <td className="align-middle">
        <NewlineText text={item.dataType} />
      </td>
      <td className="align-middle">{item.frequency} MHz</td>
      <td className="align-middle">{item.sampleRate} MHz</td>
      <td className="align-middle">
        <div>
          <Button type="button" variant="secondary" onClick={toggle}>
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
        </div>
      </td>
      <td className="align-middle">{item.author}</td>
      <td className="align-middle">{item.email}</td>
    </tr>
  );
}
