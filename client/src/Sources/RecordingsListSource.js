// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import {
  fetchRecordingsListFailure,
  fetchRecordingsListLoading,
  fetchRecordingsListSuccess,
} from '../Store/Actions/RecordingsListActions';
import parseMeta from '../Utils/parseMeta';
import { BlobServiceClient } from '@azure/storage-blob';

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

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
    const blobNames = [];
    for await (const i of containerClient.listBlobsFlat()) blobNames.push(i.name);

    for (let blobName of blobNames) {
      // only process meta-data files, and only ones that have a data file to go with them
      if (blobName.split('.').pop() !== 'sigmf-meta') {
        entries.push(null);
        continue;
      }
      if (!blobNames.includes(blobName.split('.')[0] + '.sigmf-data')) {
        console.log('Missing data file to go with', blobName);
        entries.push(null);
        continue;
      }

      // entries is a list of .sigmf-meta files, including the /'s for ones inside dirs, later on we tease them out
      const fName = blobName.split('.')[0];

      const blobClient = containerClient.getBlobClient(blobName);

      // get meta content.  use .then() instead of await so it doesnt wait sequentially
      let recording = null;
      blobClient
        .download()
        .then(function (downloadBlockBlobResponse) {
          return downloadBlockBlobResponse.blobBody;
        })
        .then(function (blobBody) {
          return blobToString(blobBody);
        })
        .then(function (jsonString) {
          recording = parseMeta(jsonString, baseUrl, fName, null, null);
          const blobDataClient = containerClient.getBlobClient(fName + '.sigmf-data');
          recording['dataClient'] = blobDataClient;
          return blobDataClient.getProperties();
        })
        .then(function (properties) {
          if (!recording) {
            entries.push(null);
            return;
          }
          recording['lengthInBytes'] = properties.contentLength;
          recording['lengthInIQSamples'] = properties.contentLength / 2 / recording.bytesPerSample;
          const lengthInMillionIQSamples = properties.contentLength / 2 / recording.bytesPerSample / 1e6;
          recording['lengthInMillionIQSamples'] = Math.round(lengthInMillionIQSamples * 1000) / 1000;
          entries.push(recording); // cant gaurantee what order this happens in
        });
    }

    // Wait for all .then's spawned in the for loop to finish before we call it done
    console.log('Fetching recordings list');
    while (entries.length !== blobNames.length) {
      await delay(100); // wait 100ms before checking again
    }

    console.log('Done fetching recordings list');
  } catch (error) {
    console.log('GOT AN ERROR IN FetchRecordingsList:');
    console.log(error);
    dispatch(fetchRecordingsListFailure(error));
  }

  // remove null entries
  const final_entries = entries.filter((elements) => {
    return elements !== null;
  });

  dispatch(fetchRecordingsListSuccess(final_entries));
};
