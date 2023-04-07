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

const initialState = {
  size: 0,
  totalIQSamples: 0,
  currentMax: 0, // holds current max value of I/Q for that recording so we can scale the spectrogram appropriately
  status: 'idle',
  taps: new Float32Array(1).fill(1),
  pythonSnippet: '',
  numActiveFetches: 0,
};

export default function blobReducer(state = initialState, action) {
  switch (action.type) {
    case UPDATE_BLOB_TAPS:
      return {
        ...state,
        taps: action.payload,
      };
    case UPDATE_BLOB_PYTHON_SNIPPET:
      return {
        ...state,
        pythonSnippet: action.payload,
      };
    case UPDATE_BLOB_SIZE:
      return {
        ...state,
        size: action.payload,
      };
    case UPDATE_BLOB_TOTAL_BYTES:
      return {
        ...state,
        totalIQSamples: action.payload,
      };
    case FETCH_MORE_DATA_LOADING: // FetchMoreData/pending, where FetchMoreData is the async thunk function
      return {
        ...state,
        status: 'loading',
        numActiveFetches: state.numActiveFetches + 1,
      };
    case FETCH_MORE_DATA_SUCCESS: // FetchMoreData/fulfilled, where FetchMoreData is the async thunk function
      window.iq_data[action.payload.tile.toString()] = action.payload.samples; // use tile as key to store samples
      //console.log('Saved tile', action.payload.tile);
      return {
        ...state,
        status: 'idle',
        size: state.size + 1,
        numActiveFetches: state.numActiveFetches - 1,
      };
    case FETCH_MORE_DATA_FAILURE: // FetchMoreData/rejected, where FetchMoreData is the async thunk function
      return {
        ...state,
        status: 'error',
        numActiveFetches: state.numActiveFetches - 1,
      };
    case RESET_BLOB_OBJ:
      return initialState;
    default:
      return {
        ...state,
      };
  }
}
