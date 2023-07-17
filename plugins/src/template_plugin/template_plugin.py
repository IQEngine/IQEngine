# Copyright (c) 2023 Marc Lichtman.
# Licensed under the MIT License.

import numpy as np
import json
from pydantic.dataclasses import dataclass

@dataclass
class Plugin:
    sample_rate: int = 0
    center_freq: int = 0
    # Your custom params are below, call them whatever you want
    param1: int = 1
    param2: str = 'test2'
    param3: float = 5.67

    def run(self, samples):
        print(samples[0:10])
        print(self.sample_rate)
        print(self.center_freq)
        print(self.param1)
        print(self.param2)
        print(self.param3)

        # Your Plugin (and optionally, classification) code here
        
        # When making a detector, for the return, make a list, then for each detected emission, add one of these dicts to the list:   
        annotations = []
        an = {}
        an['core:freq_lower_edge'] = 1 # Hz
        an['core:freq_upper_edge'] = 2 # Hz
        an['core:sample_start'] = 3
        an['core:sample_count'] = 4
        an["core:label"] = "Unknown"
        annotations.append(an)
        return {
            "status" : "SUCCESS",
            "data_output" : [],
            "annotations" : annotations
        }

if __name__ == "__main__":
    # Example of how to test your plugin locally
    fname = "C:\\Users\\marclichtman\\Downloads\\synthetic"
    with open(fname + '.sigmf-meta', 'r') as f:
        meta_data = json.load(f)
    sample_rate = meta_data["global"]["core:sample_rate"]
    center_freq = meta_data["captures"][0]['core:frequency']
    samples = np.fromfile(fname + '.sigmf-data', dtype=np.complex64)
    params = {'sample_rate': sample_rate, 'center_freq': center_freq, 'param1': 1, 'param2': 'test2', 'param3': 5.67}
    plugin = Plugin(**params)
    annotations = plugin.run(samples)
    print(annotations)