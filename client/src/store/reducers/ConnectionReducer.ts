// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License
import { DataSource } from '@/api/Models';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

const initialState = {
  dataSources: {} as Record<string, DataSource>,
};

export const connectionSlicer = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    upsertDataSource: (state, action: PayloadAction<DataSource>) => {
      const dataSourceKey = `${action.payload.account}/${action.payload.container}`;
      state.dataSources[dataSourceKey] = action.payload;
    }
  },
});

export const {
  upsertDataSource,
} = connectionSlicer.actions;

export default connectionSlicer.reducer;
