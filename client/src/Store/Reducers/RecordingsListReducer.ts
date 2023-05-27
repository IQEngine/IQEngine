// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import parseMeta from '@/Utils/parseMeta';
import { BlobServiceClient } from '@azure/storage-blob';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

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

export const fetchRecordingsList = createAsyncThunk(
  'recordingsList/fetchRecordingsList',
  async (args: any, thunkAPI) => {
    // this happens when its a local folder being opened
    if ('entries' in args) {
      return args.entries;
    }

    const { accountName, containerName, sasToken } = args;
    const baseUrl = `https://${accountName}.blob.core.windows.net/${containerName}/`;
    const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net?${sasToken}`);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    // List the blob(s) in the container.
    // entries is a list of .sigmf-meta files, including the /'s for ones inside dirs, later on we tease them out
    const entries = [];
    const blobNames: Array<string> = [];
    for await (const i of containerClient.listBlobsFlat()) blobNames.push(i.name);
    const blobsToProcess = blobNames.filter(
      (blobName) =>
        blobName.split('.').pop() === 'sigmf-meta' && blobNames.includes(blobName.split('.')[0] + '.sigmf-data')
    );
    let blobOperations = blobsToProcess.map(async (blobName) => {
      const fName = blobName.split('.')[0];
      const blobClient = containerClient.getBlobClient(blobName);

      // get meta content.  use .then() instead of await so it doesnt wait sequentially
      let recording = null;
      let blobBody = await (await blobClient.download()).blobBody;
      let jsonString = await blobToString(blobBody);
      recording = parseMeta(jsonString, baseUrl, fName, null, null);
      const blobDataClient = containerClient.getBlobClient(fName + '.sigmf-data');
      recording['dataClient'] = blobDataClient;
      let properties = await blobDataClient.getProperties();
      if (!recording) {
        return null;
      }
      recording['lengthInBytes'] = properties.contentLength;
      recording['lengthInIQSamples'] = properties.contentLength / 2 / recording.bytesPerSample;
      const lengthInMillionIQSamples = properties.contentLength / 2 / recording.bytesPerSample / 1e6;
      recording['lengthInMillionIQSamples'] = Math.round(lengthInMillionIQSamples * 1000) / 1000;
      return recording; // cant guarantee what order this happens in
    });
    // Wait for all .then's spawned in the for loop to finish before we call it done
    console.log('Fetching recordings list');
    const results = await Promise.all(blobOperations);
    for (let i = 0; i < results.length; i++) {
      if (results[i] !== null) {
        entries.push(results[i]);
      }
    }
    return entries;
  }
);

const initialState = { recordingsList: [], loading: false, error: '' };

export const recordingsListSlice = createSlice({
  name: 'recordingsList',
  initialState,
  reducers: {
    clearRecordingsList: (state) => {
      state.recordingsList = [];
      state.loading = false;
      state.error = '';
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchRecordingsList.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchRecordingsList.fulfilled, (state, action) => {
      state.recordingsList = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchRecordingsList.rejected, (state, action) => {
      state.recordingsList = [];
      state.loading = false;
      state.error = action.error.message;
    });
  },
});

export const { clearRecordingsList } = recordingsListSlice.actions;

export default recordingsListSlice.reducer;
