// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

export const TILE_SIZE_IN_IQ_SAMPLES = 50 * 1024 * 4; // must lead to doing a power of 2 FFT, and we *4 for datatypes with 4 bytes per sample
export const MINIMUM_SCROLL_HANDLE_HEIGHT_PIXELS = 10;
export const MAX_SIMULTANEOUS_FETCHES = 48; // when you drag the scrollbar it can accumulate many real quick, this limits them
export const DEFAULT_IQ_SLICE_SIZE = TILE_SIZE_IN_IQ_SAMPLES * 10; // 10 tiles
export const INITIAL_PYTHON_SNIPPET = `import numpy as np
import time
start_t = time.time()
x = x*1
print("Time elapsed:", (time.time() - start_t)*1e3, "ms")`;
export const INITIAL_METADATA_SNIPPET = `{
    "global": {
        "core:datatype": "cf32_le",
        "core:sample_rate": 1000000,
        "core:hw": "PlutoSDR with 915 MHz whip antenna",
        "core:author": "Art Vandelay",
        "core:version": "1.0.0"
    },
    "captures": [
        {
            "core:sample_start": 0,
            "core:frequency": 915000000
        }
    ],
    "annotations": []
}`
