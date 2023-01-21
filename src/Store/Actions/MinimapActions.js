// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { FETCH_MINIMAP_FAILURE, FETCH_MINIMAP_LOADING, FETCH_MINIMAP_SUCCESS } from '../../Constants/MinimapTyes';
import { FetchMinimap } from '../../Sources/MinimapSource';

export const fetchMinimapLoading = (_) => ({
  type: FETCH_MINIMAP_LOADING,
});

export const fetchMinimapSuccess = (payload) => ({
  type: FETCH_MINIMAP_SUCCESS,
  payload,
});

export const fetchMinimapFailure = (_) => ({
  type: FETCH_MINIMAP_FAILURE,
});

export const fetchMinimap = (args) => FetchMinimap(args);
