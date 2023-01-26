// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { fetchMinimapFailure, fetchMinimapLoading, fetchMinimapSuccess } from '../Store/Actions/MinimapActions';
import { applyConvolve, readFileAsync } from './FetchMoreDataSource';

export const FetchMinimap = (args) => async (dispatch) => {
  console.log('running FetchMinimap');
  dispatch(fetchMinimapLoading());
  const { tile, connection, blob, data_type, offset, count } = args;

  let samples;
  let startTime = performance.now();
  try {
    if (connection.datafilehandle === null) {
      let { recording, blobClient } = connection;
      while (recording === '') {
        console.log('waiting'); // hopefully this doesn't happen, and if it does it should be pretty quick because its the time it takes for the state to set
      }
      //console.log('offset:', offset, 'count:', count);
      const downloadBlockBlobResponse = await blobClient.download(offset, count);
      const blobResp = await downloadBlockBlobResponse.blobBody; // this is how you have to do it in browser, in backend you can use readableStreamBody
      const buffer = await blobResp.arrayBuffer();
      samples = applyConvolve(buffer, blob.taps, data_type);
    } else {
      // Use a local file
      let handle = connection.datafilehandle;
      const fileData = await handle.getFile();
      console.log('offset:', offset, 'count:', count);
      const buffer = await readFileAsync(fileData.slice(offset, offset + count));
      samples = applyConvolve(buffer, blob.taps, data_type);
    }
  } catch (e) {
    dispatch(fetchMinimapFailure(e));
  }

  console.log('Fetching minimap data took', performance.now() - startTime, 'milliseconds');
  dispatch(fetchMinimapSuccess({ tile: tile, samples: samples, data_type: data_type })); // these represent the new samples
};
