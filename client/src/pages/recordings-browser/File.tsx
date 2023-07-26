// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CLIENT_TYPE_BLOB } from '@/api/Models';
import { getMeta } from '@/api/metadata/Queries';
import { FileAnnotationData } from './FileAnnotationData';
import { ModalDialog } from '@/features/ui/modal/Modal';

interface FileRowProps {
  filepath: string;
  type?: string;
  account?: string;
  container?: string;
  sasToken?: string;
}

export default function FileRow({ filepath, type, account, container, sasToken }: FileRowProps) {
  const [showModal, setShowModal] = useState(false);

  const { type: paramType, account: paramAccount, container: paramContainer, sasToken: paramSASToken } = useParams();
  type = type ?? paramType;
  account = account ?? paramAccount;
  container = container ?? paramContainer;
  sasToken = sasToken ?? paramSASToken;
  const { data: item } = getMeta(type, account, container, filepath);

  const spectrogramLink = `/spectrogram/${item?.getOrigin().type}/${item?.getOrigin().account}/${
    item?.getOrigin().container
  }/${encodeURIComponent(item?.getFilePath())}`;

  const getUrlWithAuth = (url) => {
    if (type == CLIENT_TYPE_BLOB && sasToken) {
      // get the value of sig in the sas token
      const sig = sasToken
        .split('&')
        .find((item) => item.startsWith('sig='))
        .split('=')[1];
      // url encode the sig
      const encodedSig = encodeURIComponent(sig);
      // replace the sig in the sas token with the encoded sig
      const encodedSasToken = sasToken.replace(sig, encodedSig);
      //console.log('getUrlWithAuth', 'encodedSasToken: ', encodedSasToken);
      url += `?${encodedSasToken}`;
    }
    return url;
  };

  const getThumbnailUrl = () => {
    if (!item) {
      return '';
    }
    return getUrlWithAuth(item.getThumbnailUrl());
  };

  const getDataUrl = () => {
    if (!item) {
      return '';
    }
    return getUrlWithAuth(item.getDataUrl());
  };

  const getMetadataUrl = () => {
    if (!item) {
      return '';
    }
    return getUrlWithAuth(item.getMetadataUrl());
  };

  function NewlineText(props) {
    const text = props.text;
    return <div className="datatypetext">{text}</div>;
  }

  if (!item) {
    return (
      <tr className="hover:bg-info/10 text-center py-2 h-32">
        <td className="px-4 min-w-fit"></td>
        <td className="align-middle text-left">
          <h2>{filepath}</h2>
        </td>
        <td className="align-middle"></td>
        <td className="align-middle"></td>
        <td className="align-middle"></td>
        <td className="align-middle"></td>
        <td className="align-middle"></td>
        <td className="align-middle"></td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-info/10 text-center py-2 h-32">
      {
        <>
          {/* If we are looking at a recording from blob storage */}
          <td className="px-4 min-w-fit">
            <Link to={spectrogramLink} onClick={() => {}}>
              <div className="zoom">
                <img src={getThumbnailUrl()} alt="Spectrogram Thumbnail" style={{ width: '200px', height: '100px' }} />
              </div>
            </Link>
          </td>
          <td className="align-middle text-left">
            <Link to={spectrogramLink} onClick={() => {}}>
              <h2>{item.getFileName()}</h2>
            </Link>
            <div title={item.getDescription()}>{item.getShortDescription()}</div>
            {/* File download links */}
            <>
              {'('}download:&nbsp;
              <a href={getDataUrl()}>data</a>
              ,&nbsp;
              <a href={getMetadataUrl()}>meta</a>
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
            onClick={() => {
              setShowModal(true);
            }}
          >
            {item.annotations?.length ?? 0}
          </button>
          {showModal && (
            <ModalDialog setShowModal={setShowModal} heading={item.getFileName()}>
            <FileAnnotationData
              annotations={item?.annotations}
            />
            </ModalDialog>
          )}
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
