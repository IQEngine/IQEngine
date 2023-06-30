// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

export const TILE_SIZE_IN_IQ_SAMPLES = Math.pow(2, 17); // should always be a power of 2
export const MINIMUM_SCROLL_HANDLE_HEIGHT_PIXELS = 10;
export const COLORMAP_DEFAULT = 'viridis';
export const MINIMAP_FFT_SIZE = 64;
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
}`;
export const INITIAL_ANNOTATIONS_SNIPPET = `{
    "annotations": [{
        "core:sample_start": 100000,
        "core:sample_count": 200000,
        "core:freq_lower_edge": 883275000,
        "core:freq_upper_edge": 884625000,
        "core:description": "LTE"
    }]
}`;
