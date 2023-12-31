import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CLIENT_TYPE_BLOB, CLIENT_TYPE_LOCAL } from '@/api/Models';
import { getMeta } from '@/api/metadata/queries';
import { AnnotationData } from './annotation-data';
import { ModalDialog } from '@/features/ui/modal/Modal';
import { useIntersectionObserver } from 'usehooks-ts';
import LocalDirThumbnail from './local-dir-thumbnail';

interface FileRowProps {
  filepath: string;
  type?: string;
  account?: string;
  container?: string;
  sasToken?: string;
  geoSelected?: boolean;
  trackToggle?: (account: string, container: string, filepath: string) => any;
}

const FileRow = ({ filepath, type, account, container, sasToken, geoSelected = false, trackToggle }: FileRowProps) => {
  const [showModal, setShowModal] = useState(false);
  const ref = useRef<HTMLTableRowElement | null>(null);
  const entry = useIntersectionObserver(ref, {});
  const isVisible = !!entry?.isIntersecting;
  const { data: item } = getMeta(type, account, container, filepath, isVisible);

  const spectrogramLink = `/view/${item?.getOrigin().type}/${item?.getOrigin().account}/${item?.getOrigin()
    .container}/${encodeURIComponent(item?.getFilePath())}`;

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
      <tr ref={ref} className="hover:bg-info/10 text-center py-2 h-32">
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
    <tr ref={ref} className={'hover:bg-info/10 text-center py-2 h-32'}>
      {
        <>
          <td className="pl-0 pr-1 min-w-fit">
            {/* When looking at a local dir vs blob */}
            {type === CLIENT_TYPE_LOCAL ? (
              <LocalDirThumbnail filepath={filepath} type={type} account={account} container={container} />
            ) : (
              <Link to={spectrogramLink} onClick={() => {}}>
                <div className="zoom">
                  <img
                    src={getThumbnailUrl()}
                    alt="Spectrogram Thumbnail"
                    style={{ width: '200px', height: '100px' }}
                  />
                </div>
              </Link>
            )}
          </td>
          <td className={'align-middle text-left'}>
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
            <ModalDialog setShowModal={setShowModal} heading={item.getFileName()} classList="max-w-full">
              <AnnotationData annotations={item?.annotations} />
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
      {geoSelected && (
        <td className="align-middle">
          <button
            onClick={() => trackToggle(account, container, filepath)}
            className="rounded ml-5 border-2 border-secondary p-1 hover:bg-secondary hover:text-base-100"
          >
            Track
          </button>
        </td>
      )}
    </tr>
  );
};

export default FileRow;
