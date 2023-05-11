// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import {
  FETCH_MORE_DATA_FAILURE,
  FETCH_MORE_DATA_LOADING,
  FETCH_MORE_DATA_SUCCESS,
  RESET_BLOB_OBJ,
  UPDATE_BLOB_SIZE,
  UPDATE_BLOB_TOTAL_BYTES,
  UPDATE_BLOB_TAPS,
  UPDATE_BLOB_PYTHON_SNIPPET,
} from '../../Constants/BlobTypes';
import FetchMoreData from '../../Sources/FetchMoreDataSource';

export const updateBlobTaps = (payload) => ({
  type: UPDATE_BLOB_TAPS,
  payload,
});

export const updateBlobPythonSnippet = (payload) => ({
  type: UPDATE_BLOB_PYTHON_SNIPPET,
  payload,
});

export const updateBlobSize = (payload) => ({
  type: UPDATE_BLOB_SIZE,
  payload,
});

export const updateBlobTotalIQSamples = (payload) => ({
  type: UPDATE_BLOB_TOTAL_BYTES,
  payload,
});

export const fetchMoreDataLoading = (_) => ({
  type: FETCH_MORE_DATA_LOADING,
});

export const fetchMoreDataSuccess = (payload) => ({
  type: FETCH_MORE_DATA_SUCCESS,
  payload,
});

export const fetchMoreDataFailure = (_) => ({
  type: FETCH_MORE_DATA_FAILURE,
});

export const resetBlob = () => ({
  type: RESET_BLOB_OBJ,
});

export const fetchMoreData = (args) => FetchMoreData(args);
