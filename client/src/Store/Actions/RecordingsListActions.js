// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import {
  FETCH_RECORDINGS_LIST_DATA_FAILURE,
  FETCH_RECORDINGS_LIST_DATA_LOADING,
  FETCH_RECORDINGS_LIST_DATA_SUCCESS,
} from '../../Constants/RecordingsListTypes';
import { FetchRecordingsList } from '../../Sources/RecordingsListSource';

export const fetchRecordingsListLoading = (_) => ({
  type: FETCH_RECORDINGS_LIST_DATA_LOADING,
});

export const fetchRecordingsListSuccess = (payload) => ({
  type: FETCH_RECORDINGS_LIST_DATA_SUCCESS,
  payload,
});

export const fetchRecordingsListFailure = (payload) => ({
  type: FETCH_RECORDINGS_LIST_DATA_FAILURE,
  payload,
});

export const fetchRecordingsList = (connection) => FetchRecordingsList(connection);
