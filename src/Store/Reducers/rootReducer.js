// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { combineReducers } from '@reduxjs/toolkit';
import blobReducer from './BlobReducer';
import connectionReducer from './ConnectionReducer';
import fetchMetaReducer from './FetchMetaReducer';
import recordingsListReducer from './RecordingsListReducer';
import minimapReducer from './MinimapReducer';

const rootReducer = combineReducers({
  blobReducer,
  connectionReducer,
  fetchMetaReducer,
  recordingsListReducer,
  minimapReducer,
});

export default rootReducer;
