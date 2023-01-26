// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { configureStore } from '@reduxjs/toolkit';

import thunk from 'redux-thunk';
import rootReducer from './Reducers/rootReducer';

const store = configureStore({
  reducer: rootReducer,
  middleware: [thunk],
});

export default store;
