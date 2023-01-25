// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export const FETCHES_PER_USEEFFECT = 1; // num of calls to FetchData within SpectrogramPanel's useEffect
export const COUNT_PER_FETCH = 1024 * 1000; // in units of ints/floats (so half IQ samples) and must be a power of 2
export const TILE_SIZE_IN_BYTES = 50 * 1024 * 4; // must lead to doing a power of 2 FFT, and we *4 for datatypes with 4 bytes per sample
export const MINIMUM_SCROLL_HANDLE_HEIGHT = 10; // pixels
