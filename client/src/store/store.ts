// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { configureStore } from '@reduxjs/toolkit';

import connectionReducer from './reducers/ConnectionReducer';
import localClientReducer from './reducers/LocalClientReducer';

const store = configureStore({
  reducer: {
    connection: connectionReducer,
    localClient: localClientReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
