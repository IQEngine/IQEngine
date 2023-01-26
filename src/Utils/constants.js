// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

export const FETCHES_PER_USEEFFECT = 1; // num of calls to FetchData within SpectrogramPanel's useEffect
export const COUNT_PER_FETCH = 1024 * 1000; // in units of ints/floats (so half IQ samples) and must be a power of 2
export const TILE_SIZE_IN_BYTES = 50 * 1024 * 2; // must lead to doing a power of 2 FFT
export const MINIMUM_SCROLL_HANDLE_HEIGHT = 10; // pixels
