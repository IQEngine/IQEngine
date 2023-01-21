// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { FETCH_MINIMAP_FAILURE, FETCH_MINIMAP_LOADING, FETCH_MINIMAP_SUCCESS } from '../../Constants/MinimapTyes';

const initialState = {
  status: 'idle',
  minimap: {},
  error: '',
  size: 0,
};

export default function minimapReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_MINIMAP_LOADING: // FetchMoreData/pending, where FetchMoreData is the async thunk function
      return {
        ...state,
        status: 'loading',
      };
    case FETCH_MINIMAP_SUCCESS: // FetchMoreData/fulfilled, where FetchMoreData is the async thunk function
      window.iq_data[action.payload.tile.toString()] = action.payload.samples; // use tile as key to store samples
      //console.log('Saved tile', action.payload.tile);
      return {
        ...state,
        status: 'idle',
        size: state.size + 1,
      };
    case FETCH_MINIMAP_FAILURE: // FetchMoreData/rejected, where FetchMoreData is the async thunk function
      return {
        ...state,
        status: 'error',
      };
    default:
      return {
        ...state,
      };
  }
}
