// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License
import { DataSource } from '@/api/Models';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

const initialState = {
  accountName: '',
  containerName: '',
  sasToken: '',
  recording: '',
  metafilehandle: '',
  datafilehandle: '',
  blobClient: null,
  dataSources: {} as Record<string, DataSource>,
};

export const connectionSlicer = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    upsertDataSource: (state, action: PayloadAction<DataSource>) => {
      const dataSourceKey = `${action.payload.account}/${action.payload.container}`;
      state.dataSources[dataSourceKey] = action.payload;
    },
    updateConnectionAccountName: (state, action) => {
      state.accountName = action.payload;
    },
    updateConnectionContainerName: (state, action) => {
      state.containerName = action.payload;
    },
    updateConnectionRecording: (state, action) => {
      state.recording = action.payload;
    },
    updateConnectionSasToken: (state, action) => {
      state.sasToken = action.payload;
    },
    updateConnectionMetaFileHandle: (state, action) => {
      state.metafilehandle = action.payload;
    },
    updateConnectionDataFileHandle: (state, action) => {
      state.datafilehandle = action.payload;
    },
    updateConnectionBlobClient: (state, action) => {
      state.blobClient = action.payload;
    },
    resetConnection: (state) => {
      state.accountName = '';
      state.containerName = '';
      state.sasToken = '';
      state.recording = '';
      state.metafilehandle = '';
      state.datafilehandle = '';
      state.blobClient = null;
    },
  },
});

export const {
  upsertDataSource,
  updateConnectionAccountName,
  updateConnectionContainerName,
  updateConnectionRecording,
  updateConnectionSasToken,
  updateConnectionMetaFileHandle,
  updateConnectionDataFileHandle,
  updateConnectionBlobClient,
  resetConnection,
} = connectionSlicer.actions;

export default connectionSlicer.reducer;
