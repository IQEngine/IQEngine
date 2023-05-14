// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { updateBlobTotalIQSamples } from '../Store/Actions/BlobActions';
import { updateConnectionBlobClient } from '../Store/Actions/ConnectionActions';
import { returnMetaDataBlob } from '../Store/Actions/FetchMetaActions';
import { dataTypeToBytesPerSample } from '../Utils/selector';
import { BlobServiceClient } from '@azure/storage-blob';

// Thunk function

export const FetchMeta = (connection) => async (dispatch) => {
  console.log('running fetchMeta');
  let meta_string = '';
  let meta_json;
  let blobName = connection.recording + '.sigmf-meta'; // has to go outside of condition or else react gets mad
  if (connection.metafilehandle === null) {
    let { accountName, containerName, domainName, sasToken } = connection;
    if (containerName === '') {
      console.error('container name was not filled out for some reason');
    }
    // Get the blob client.  TODO: REPLACE THIS WITH THE HANDLE WE ALREADY FOUND
    const blobServiceClient = new BlobServiceClient(`https://${accountName}.${domainName}?${sasToken}`);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobMetaClient = containerClient.getBlobClient(blobName.replaceAll('(slash)', '/'));
    const downloadBlockBlobResponse = await blobMetaClient.download();
    const blob = await downloadBlockBlobResponse.blobBody;
    meta_string = await blob.text();
    meta_json = JSON.parse(meta_string);
  } else {
    const metaFile = await connection.metafilehandle.getFile();
    const dataFile = await connection.datafilehandle.getFile();
    meta_string = await metaFile.text();
    meta_json = JSON.parse(meta_string);

    // we need to set TotalIQSamples here for local files (it has already been set for blob)
    dispatch(
      updateBlobTotalIQSamples(dataFile.size / dataTypeToBytesPerSample(meta_json['global']['core:datatype']) / 2)
    );
    dispatch(updateConnectionBlobClient('not null')); // even though we dont use the blobclient for local files, this triggers the initial fetch/render
  }
  dispatch(returnMetaDataBlob(meta_json));
};
