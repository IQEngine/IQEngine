// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { configureStore } from '@reduxjs/toolkit';

import blobReducer from './Reducers/BlobReducer';
import connectionReducer from './Reducers/ConnectionReducer';
import fetchMetaReducer from './Reducers/FetchMetaReducer';
import minimapReducer from './Reducers/MinimapReducer';
import recordingsListReducer from './Reducers/RecordingsListReducer';

const store = configureStore({
  reducer: {
    blob: blobReducer,
    connection: connectionReducer,
    meta: fetchMetaReducer,
    minimap: minimapReducer,
    recordingsList: recordingsListReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
