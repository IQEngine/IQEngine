// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { updateBlobTotalBytes } from '../Store/Actions/BlobActions';
import { updateConnectionBlobClient } from '../Store/Actions/ConnectionActions';
import { returnMetaDataBlob } from '../Store/Actions/FetchMetaActions';
const { BlobServiceClient } = require('@azure/storage-blob');

// Thunk function

export const FetchMeta = (connection) => async (dispatch) => {
  console.log('running fetchMeta');
  let meta_string = '';
  let blobName = connection.recording + '.sigmf-meta'; // has to go outside of condition or else react gets mad
  if (connection.metafilehandle === null) {
    let { accountName, containerName, sasToken } = connection;
    if (containerName === '') {
      console.error('container name was not filled out for some reason');
    }
    // Get the blob client
    const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net?${sasToken}`);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobMetaClient = containerClient.getBlobClient(blobName);
    const downloadBlockBlobResponse = await blobMetaClient.download();
    const blob = await downloadBlockBlobResponse.blobBody;
    meta_string = await blob.text();
  } else {
    const metaFile = await connection.metafilehandle.getFile();
    const dataFile = await connection.datafilehandle.getFile();
    meta_string = await metaFile.text();
    const numBytes = dataFile.size;
    dispatch(updateBlobTotalBytes(numBytes));
    dispatch(updateConnectionBlobClient('not null')); // even though we dont use the blobclient for local files, this triggers the initial fetch/render
  }

  const meta_json = JSON.parse(meta_string);
  dispatch(returnMetaDataBlob(meta_json));
};
