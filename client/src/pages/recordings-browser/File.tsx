// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useRef } from 'react';
import { Link } from 'react-router-dom';

import { SigMFMetadata } from '@/utils/sigmfMetadata';

interface FileRowProps {
  item: SigMFMetadata;
}
export default function FileRow({ item }: FileRowProps) {
  const spectogramLink = `/spectrogram/${item.getOrigin().type}/${item.getOrigin().account}/${
    item.getOrigin().container
  }/${encodeURIComponent(item.getFilePath())}`;
  const modal = useRef(null);
  const toggle = () => {
    if (modal.current.className === 'modal w-full h-full') {
      modal.current.className = 'modal modal-open w-full h-full';
    } else {
      modal.current.className = 'modal w-full h-full';
    }
  };
  const annotationsData = item.annotations?.map((item, index) => {
    const deepItemCopy = JSON.parse(JSON.stringify(item));
    delete deepItemCopy['core:sample_start'];
    delete deepItemCopy['core:sample_count'];
    delete deepItemCopy['core:freq_lower_edge'];
    delete deepItemCopy['core:freq_upper_edge'];
    delete deepItemCopy['core:description'];

    return (
      <tr key={index} className="h-12">
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
    <tr className="hover:bg-info/10 text-center py-2 h-32">
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
            className="mb-2 rounded border-2 border-secondary p-1 hover:bg-secondary hover:text-base-100"
            onClick={toggle}
          >
            {item.annotations?.length ?? 0}
          </button>
          <dialog ref={modal} className="modal w-full h-full">
            <form method="dialog" className="modal-box  max-w-full">
              <h3 className="font-bold text-lg text-primary">{item.getFileName()}</h3>
              <button className="absolute right-2 top-2 text-secondary font-bold" onClick={toggle}>
                ✕
              </button>
              <div className="grid justify-items-stretch">
                <table className="text-base-content">
                  <thead className="text-primary border-b-2 h-12 border-accent">
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
              </div>
            </form>
          </dialog>
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
