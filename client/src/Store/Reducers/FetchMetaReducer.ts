// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { BlobServiceClient } from '@azure/storage-blob';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { updateBlobTotalIQSamples } from './BlobReducer';
import { dataTypeToBytesPerSample } from '@/Utils/selector';
import { updateConnectionBlobClient } from './ConnectionReducer';

const initialState = { annotations: [], captures: [], global: {} };

export const fetchMeta = createAsyncThunk('fetchMata/fetchMeta', async (args: any, thunkAPI) => {
  console.log('running fetchMeta');
  const connection = args;
  let meta_string = '';
  let meta_json;
  let blobName = connection.recording + '.sigmf-meta'; // has to go outside of condition or else react gets mad
  if (connection.metafilehandle === null) {
    let { accountName, containerName, sasToken } = connection;
    if (containerName === '') {
      console.error('container name was not filled out for some reason');
    }
    // Get the blob client.  TODO: REPLACE THIS WITH THE HANDLE WE ALREADY FOUND
    const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net?${sasToken}`);
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
    thunkAPI.dispatch(
      updateBlobTotalIQSamples(dataFile.size / dataTypeToBytesPerSample(meta_json['global']['core:datatype']) / 2)
    );
    thunkAPI.dispatch(updateConnectionBlobClient('not null')); // even though we dont use the blobclient for local files, this triggers the initial fetch/render
  }
  return meta_json;
});

export const fetchMetaSlicer = createSlice({
  name: 'fetchMeta',
  initialState,
  reducers: {
    returnMetaDataBlob: (state, action) => {
      state = action.payload;
    },
    resetMetaObj: (state) => {
      state.annotations = initialState.annotations;
      state.captures = initialState.captures;
      state.global = initialState.global;
    },
    setMeta: (state, action) => {
      state = action.payload;
    },
    setMetaGlobal: (state, action) => {
      state.global = action.payload;
    },
    setMetaAnnotations: (state, action) => {
      state.annotations = action.payload;
    },
    setMetaAnnotation(state, action) {
      state.annotations[action.payload.index] = action.payload.annotation;
    },
    setMetaCaptures: (state, action) => {
      state.captures = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMeta.fulfilled, (state, action) => {
      console.log(`fetchMeta.fulfilled ${JSON.stringify(action.payload)}`);
      state.annotations = action.payload.annotations;
      state.captures = action.payload.captures;
      state.global = action.payload.global;
    });
    builder.addCase(fetchMeta.rejected, (state, action) => {
      console.log(`fetchMeta.rejected ${JSON.stringify(action.payload)}`);
    });
    builder.addCase(fetchMeta.pending, (state, action) => {
      console.log('fetchMeta.pending');
    });
  },
});

export const {
  returnMetaDataBlob,
  resetMetaObj,
  setMeta,
  setMetaGlobal,
  setMetaAnnotations,
  setMetaCaptures,
  setMetaAnnotation,
} = fetchMetaSlicer.actions;
export default fetchMetaSlicer.reducer;
