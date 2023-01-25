// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  fetchRecordingsListFailure,
  fetchRecordingsListLoading,
  fetchRecordingsListSuccess,
} from '../Store/Actions/RecordingsListActions';
import parseMeta from '../Utils/parseMeta';

const { BlobServiceClient } = require('@azure/storage-blob');

async function blobToString(blob) {
  const fileReader = new FileReader();
  return new Promise((resolve, reject) => {
    fileReader.onloadend = (ev) => {
      resolve(ev.target.result);
    };
    fileReader.onerror = reject;
    fileReader.readAsText(blob);
  });
}

// get the length of the data file. Since some recordings may be broken, we need to return 0 by default
async function getLength(containerClient, name) {
  try {
    const dataBlobName = name + '.sigmf-data';
    const blobDataClient = containerClient.getBlobClient(dataBlobName);
    const properties = await blobDataClient.getProperties();
    const numBytes = properties.contentLength;
    return { length: numBytes, client: blobDataClient };
  } catch (_) {
    return { length: 0, client: null };
  }
}

export const FetchRecordingsList = (connection) => async (dispatch) => {
  dispatch(fetchRecordingsListLoading());

  // this happens when its a local folder being opened
  if ('entries' in connection) {
    dispatch(fetchRecordingsListSuccess(connection.entries));
  }

  const { accountName, containerName, sasToken } = connection;
  const baseUrl = `https://${accountName}.blob.core.windows.net/${containerName}/`;
  const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net?${sasToken}`);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // List the blob(s) in the container.
  const entries = [];
  try {
    const blob_names = [];
    for await (const i of containerClient.listBlobsFlat()) blob_names.push(i.name);
    for await (const blob of containerClient.listBlobsFlat()) {
      // only process meta-data files, and only ones that have a data file to go with them
      if (blob.name.split('.').pop() === 'sigmf-meta') {
        if (!blob_names.includes(blob.name.split('.')[0] + '.sigmf-data')) {
          console.log('Missing data file to go with', blob.name);
          continue;
        }
        const blobClient = containerClient.getBlobClient(blob.name);
        const downloadBlockBlobResponse = await blobClient.download(); // get meta content

        const json_string = await blobToString(await downloadBlockBlobResponse.blobBody);
        // entries is a list of .sigmf-meta files, including the /'s for ones inside dirs, later on we tease them out
        const fName = blob.name.split('.')[0];

        const recording = parseMeta(json_string, baseUrl, fName, null, null);
        if (!recording) continue;

        const { length, client } = await getLength(containerClient, fName);
        let lengthInMillionIQSamples = length / 2 / recording.bytesPerSample / 1e6;
        recording['lengthInMillionIQSamples'] = Math.round(lengthInMillionIQSamples * 1000) / 1000;
        recording['lengthInBytes'] = length;
        recording['dataClient'] = client;

        if (recording) {
          entries.push(recording);
        }
      }
    }
  } catch (error) {
    dispatch(fetchRecordingsListFailure(error));
  }
  dispatch(fetchRecordingsListSuccess(entries));
};
