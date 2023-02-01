// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

export const TILE_SIZE_IN_BYTES = 50 * 1024 * 4; // must lead to doing a power of 2 FFT, and we *4 for datatypes with 4 bytes per sample
export const MINIMUM_SCROLL_HANDLE_HEIGHT = 10; // pixels
export const MAX_SIMULTANEOUS_FETCHES = 48; // when you drag the scrollbar it can accumulate many real quick, this limits them
