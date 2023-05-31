// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { applyProcessing, convertToFloat32, readFileAsync } from '@/Sources/FetchMoreDataSource';
import { dataTypeToBytesPerSample } from '@/Utils/selector';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const initialState = {
  status: 'idle',
  iqData: {},
  error: '',
  size: 0,
};

export const fetchMinimap = createAsyncThunk('minimap/fetchMinimap', async (args: any, thunkAPI) => {
  console.log('running FetchMinimap');
  thunkAPI.dispatch(fetchMinimapLoading());
  const { tile, connection, blob, dataType, offset, count } = args;

  // offset and count are in IQ samples, convert to bytes
  const bytesPerSample = dataTypeToBytesPerSample(dataType);
  const offsetBytes = offset * bytesPerSample * 2;
  const countBytes = count * bytesPerSample * 2;

  let samples;
  let startTime = performance.now();
  try {
    let buffer;
    if (connection.datafilehandle === null) {
      let { recording, blobClient } = connection;
      while (recording === '') {
        console.log('waiting'); // hopefully this doesn't happen, and if it does it should be pretty quick because its the time it takes for the state to set
      }
      const downloadBlockBlobResponse = await blobClient.download(offsetBytes, countBytes);
      const blobResp = await downloadBlockBlobResponse.blobBody; // this is how you have to do it in browser, in backend you can use readableStreamBody
      buffer = await blobResp.arrayBuffer();
    } else {
      // Use a local file
      let handle = connection.datafilehandle;
      const fileData = await handle.getFile();
      buffer = await readFileAsync(fileData.slice(offsetBytes, offsetBytes + countBytes));
    }
    samples = convertToFloat32(buffer, dataType); // samples are kept as float32 under the hood for simplicity
    samples = await applyProcessing(samples, blob.taps, blob.pythonSnippet, null);
  } catch (e) {
    thunkAPI.dispatch(fetchMinimapFailure(e));
  }

  console.log('Fetching minimap data took', performance.now() - startTime, 'milliseconds');
  thunkAPI.dispatch(fetchMinimapSuccess({ tile: tile, samples: samples, dataType: dataType })); // these represent the new samples
});

export const minimapSlicer = createSlice({
  name: 'minimap',
  initialState,
  reducers: {
    fetchMinimapLoading: (state) => {
      state.status = 'loading';
    },
    fetchMinimapSuccess: (state, action) => {
      state.status = 'idle';
      state.iqData[action.payload.tile.toString()] = action.payload.samples;
      state.size += 1;
    },
    fetchMinimapFailure: (state, action) => {
      state.status = 'error';
      state.error = action.payload;
    },
  },
});

export const { fetchMinimapLoading, fetchMinimapSuccess, fetchMinimapFailure } = minimapSlicer.actions;
export default minimapSlicer.reducer;
