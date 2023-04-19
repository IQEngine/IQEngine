# Copyright (c) 2023 Marc Lichtman.
# Licensed under the MIT License.

import numpy as np
import time
import json

def detect(samples, sample_rate, center_freq, detector_settings): # dont change anything on this line

    # Your detection (and optionally, classification) code here
    
    # Make sure detector_settings is a dict with key/value pairs, only 1 layer deep (no values that are a dict themselves)

    # For the return, make a list, then for each detected emission, add one of these dicts to the list:   
    annotations = []

    an = {}
    an['core:freq_lower_edge'] = 1 # Hz
    an['core:freq_upper_edge'] = 2 # Hz
    an['core:sample_start'] = 3
    an['core:sample_count'] = 4
    an["core:description"] = "Unknown"

    annotations.append(an)

    return annotations


if __name__ == "__main__":
    # Example of how to test your detector locally
    fname = "C:\\Users\\marclichtman\\Downloads\\synthetic"
    with open(fname + '.sigmf-meta', 'r') as f:
        meta_data = json.load(f)
    sample_rate = meta_data["global"]["core:sample_rate"]
    center_freq = meta_data["captures"][0]['core:frequency']
    samples = np.fromfile(fname + '.sigmf-data', dtype=np.complex64)
    detector_settings = {'time_window_size': 10, 'power_threshold_db': 20, 'time_margin_seconds': 0.001, 'min_bw': 10e3}
    annotations = detect(samples, sample_rate, center_freq, detector_settings)
    print(annotations)