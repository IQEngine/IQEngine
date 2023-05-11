// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import {
  RESET_CONNECTION_OBJ,
  UPDATE_CONNECTION_ACCOUNT_NAME,
  UPDATE_CONNECTION_CONTAINER_NAME,
  UPDATE_CONNECTION_DATA_FILE_HANDLE,
  UPDATE_CONNECTION_META_FILE_HANDLE,
  UPDATE_CONNECTION_RECORDING,
  UPDATE_CONNECTION_SAS_TOKEN,
  UPDATE_CONNECTION_BLOB_CLIENT,
} from '../../Constants/ConnectionTypes';

export const updateConnectionAccountName = (payload) => ({
  type: UPDATE_CONNECTION_ACCOUNT_NAME,
  payload,
});

export const updateConnectionContainerName = (payload) => ({
  type: UPDATE_CONNECTION_CONTAINER_NAME,
  payload,
});

export const updateConnectionSasToken = (payload) => ({
  type: UPDATE_CONNECTION_SAS_TOKEN,
  payload,
});

export const updateConnectionRecording = (payload) => ({
  type: UPDATE_CONNECTION_RECORDING,
  payload,
});

export const updateConnectionMetaFileHandle = (payload) => ({
  type: UPDATE_CONNECTION_META_FILE_HANDLE,
  payload,
});

export const updateConnectionDataFileHandle = (payload) => ({
  type: UPDATE_CONNECTION_DATA_FILE_HANDLE,
  payload,
});

export const updateConnectionBlobClient = (payload) => ({
  type: UPDATE_CONNECTION_BLOB_CLIENT,
  payload,
});

export const resetConnection = () => ({
  type: RESET_CONNECTION_OBJ,
});
