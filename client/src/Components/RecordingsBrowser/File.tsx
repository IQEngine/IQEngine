// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/Store/hooks';

import { SigMFMetadata } from '@/Utils/sigmfMetadata';

interface FileRowProps {
  item: SigMFMetadata;
}
export default function FileRow({ item }: FileRowProps) {
  const [modal, setModal] = useState(false);
  const spectogramLink = `/spectrogram/${item.getOrigin().type}/${item.getOrigin().account}/${
    item.getOrigin().container
  }/${encodeURIComponent(item.getFilePath())}`;
  const toggle = () => {
    setModal(!modal);
  };
  const annotationsData = item.annotations?.map((item, index) => {
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
    <tr className="hover:bg-info/10 text-center py-2 h-32 border-y-2 border-white/40">
      {/* If we are looking at a recording from blob storage */}
      {
        <>
          <td className="px-4 min-w-fit">
            <Link to={spectogramLink} onClick={() => {}}>
              <div className="zoom">
                <img
                  src={item.getThumbnailUrl()}
                  alt="Spectrogram Thumbnail"
                  style={{ width: '200px', height: '100px' }}
                />
              </div>
            </Link>
          </td>
          <td className="align-middle text-left">
            <Link to={spectogramLink} onClick={() => {}}>
              <h2>{item.getFileName()}</h2>
            </Link>
            <div title={item.getDescription()}>{item.getShortDescription()}</div>
            {/* File download links */}
            <>
              {'('}download:&nbsp;
              <a href={item.getDataUrl()}>data</a>
              ,&nbsp;
              <a href={item.getMetadataUrl()}>meta</a>
              {')'}
            </>
          </td>
        </>
      }

      <td className="align-middle">{item.getLengthInMillionIQSamples()} M</td>
      <td className="align-middle">
        <NewlineText text={item.getDataTypeDescription()} />
      </td>
      <td className="align-middle">{item.getFrequency() / 1e6} MHz</td>
      <td className="align-middle">{item.getSampleRate() / 1e6} MHz</td>
      <td className="align-middle">
        <div>
          <button
            className="mb-2 rounded border-2 border-iqengine-secondary p-1 hover:bg-iqengine-secondary hover:text-black"
            onClick={toggle}
          >
            {item.annotations?.length ?? 0}
          </button>
          <Modal isOpen={modal} toggle={toggle} size="lg">
            <ModalHeader toggle={toggle}>{item.getFileName()}</ModalHeader>
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
          <br></br>({item.captures?.length ?? 0} Capture{item.captures?.length > 1 && 's'})
        </div>
      </td>
      <td className="align-middle">
        {item.getAuthor()}
        <br></br>
        {item.getEmail()}
      </td>
    </tr>
  );
}
