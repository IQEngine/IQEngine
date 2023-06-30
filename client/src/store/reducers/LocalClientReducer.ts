import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';

const initialState = {
  files: [] as FileWithDirectoryAndFileHandle[],
};

export const localClientSlicer = createSlice({
  name: 'localClient',
  initialState,
  reducers: {
    setLocalClient: (state, action: PayloadAction<FileWithDirectoryAndFileHandle[]>) => {
      state.files = action.payload;
    },
  },
});

export const { setLocalClient } = localClientSlicer.actions;

export default localClientSlicer.reducer;
