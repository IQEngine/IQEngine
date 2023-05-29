// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { applyProcessing, convertToFloat32, readFileAsync } from '@/Sources/FetchMoreDataSource';
import { dataTypeToBytesPerSample } from '@/Utils/selector';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState = {
  size: 0,
  totalIQSamples: 0,
  currentMax: 0, // holds current max value of I/Q for that recording so we can scale the spectrogram appropriately
  status: 'idle',
  taps: new Float32Array(1).fill(1),
  pythonSnippet: '',
  numActiveFetches: 0,
  iqData: {},
  fftData: {},
  sampleRate: 1,
};

export const fetchMoreData = createAsyncThunk('blob/fetchMoreData', async (args: any, thunkAPI) => {
  const { tile, connection, blob, dataType, offset, count, pyodide } = args;

  // offset and count are in IQ samples, convert to bytes
  const bytesPerSample = dataTypeToBytesPerSample(dataType);
  const offsetBytes = offset * bytesPerSample * 2; // FIXME at some point we need to specify whether real or complex
  const countBytes = count * bytesPerSample * 2;

  let samples;
  let buffer;
  let startTime = performance.now();
  // tells us we're using blob storage
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
  samples = await applyProcessing(samples, blob.taps, blob.pythonSnippet, pyodide);

  console.log('FetchMoreData() took', performance.now() - startTime, 'ms');
  return { tile: tile, samples: samples, dataType: dataType }; // these represent the new samples
});

export const blobSlicer = createSlice({
  name: 'blob',
  initialState,
  reducers: {
    updateBlobTaps: (state, action: PayloadAction<Float32Array>) => {
      state.taps = action.payload;
    },
    updateBlobPythonSnippet: (state, action: PayloadAction<string>) => {
      state.pythonSnippet = action.payload;
    },
    updateBlobSize: (state, action: PayloadAction<number>) => {
      state.size = action.payload;
    },
    updateBlobTotalIQSamples: (state, action: PayloadAction<number>) => {
      state.totalIQSamples = action.payload;
    },
    updateBlobIQData: (state, action: PayloadAction<any>) => {
      state.iqData[action.payload.tile.toString()] = action.payload.samples;
      state.size += 1;
    },
    updateBlobFFTData: (state, action: PayloadAction<any>) => {
      state.fftData[action.payload.tile.toString()] = action.payload.fftData;
    },
    resetBlobFFTData: (state) => {
      console.log('CLEARED FFTTTTTTTTTTTTTTTT');
      state.fftData = {};
    },
    updateBlobSampleRate: (state, action: PayloadAction<number>) => {
      state.sampleRate = action.payload;
    },
    resetBlobObject: (state) => {
      state.size = 0;
      state.totalIQSamples = 0;
      state.currentMax = 0;
      state.status = 'idle';
      state.taps = new Float32Array(1).fill(1);
      state.pythonSnippet = '';
      state.numActiveFetches = 0;
      state.iqData = {};
      state.fftData = {};
      state.sampleRate = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMoreData.pending, (state) => {
        state.status = 'loading';
        state.numActiveFetches += 1;
      })
      .addCase(fetchMoreData.fulfilled, (state, action) => {
        state.status = 'idle';
        state.numActiveFetches -= 1;
        state.iqData[action.payload.tile.toString()] = action.payload.samples;
        state.size += 1;
      })
      .addCase(fetchMoreData.rejected, (state) => {
        state.status = 'idle';
        state.numActiveFetches -= 1;
      });
  },
});

export const {
  updateBlobTaps,
  updateBlobPythonSnippet,
  updateBlobSize,
  updateBlobTotalIQSamples,
  updateBlobIQData,
  resetBlobObject,
  updateBlobFFTData,
  resetBlobFFTData,
  updateBlobSampleRate,
} = blobSlicer.actions;
export default blobSlicer.reducer;
