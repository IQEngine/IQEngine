// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { fetchMinimapFailure, fetchMinimapLoading, fetchMinimapSuccess } from '../Store/Actions/MinimapActions';
import { applyProcessing, convertToFloat32, readFileAsync } from './FetchMoreDataSource';

export const FetchMinimap = (args) => async (dispatch) => {
  console.log('running FetchMinimap');
  dispatch(fetchMinimapLoading());
  const { tile, connection, blob, dataType, offset, count } = args;

  // offset and count are in IQ samples, convert to bytes
  let bytesPerSample;
  if (dataType === 'ci16_le') {
    bytesPerSample = 2;
  } else if (dataType === 'cf32_le') {
    bytesPerSample = 4;
  } else {
    bytesPerSample = 2;
  }
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
    dispatch(fetchMinimapFailure(e));
  }

  console.log('Fetching minimap data took', performance.now() - startTime, 'milliseconds');
  dispatch(fetchMinimapSuccess({ tile: tile, samples: samples, dataType: dataType })); // these represent the new samples
};
