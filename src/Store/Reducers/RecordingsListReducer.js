// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  FETCH_RECORDINGS_LIST_DATA_FAILURE,
  FETCH_RECORDINGS_LIST_DATA_LOADING,
  FETCH_RECORDINGS_LIST_DATA_SUCCESS,
} from '../../Constants/RecordingsListTypes';

const initialState = { recordingsList: [], loading: false, error: '' };

export default function recordingsListReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_RECORDINGS_LIST_DATA_LOADING: {
      return {
        ...state,
        loading: true,
      };
    }
    case FETCH_RECORDINGS_LIST_DATA_SUCCESS: {
      return {
        ...state,
        recordingsList: action.payload,
        loading: false,
      };
    }
    case FETCH_RECORDINGS_LIST_DATA_FAILURE: {
      return {
        ...state,
        recordingsList: [],
        loading: false,
        error: action.payload,
      };
    }
    default:
      return state;
  }
}
