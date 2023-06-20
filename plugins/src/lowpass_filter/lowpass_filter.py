# Copyright (c) 2023 Marc Lichtman.
# Licensed under the MIT License.

import numpy as np
from pydantic.dataclasses import dataclass
from scipy import signal

@dataclass
class Plugin:
    sample_rate: int = 0
    center_freq: int = 0

    # custom params
    numtaps: int = 51
    cutoff: float = 1e6 # relative to sample rate
    width: float = 0.1e6 # relative to sample rate

    def run(self, samples):
        h = signal.firwin(self.numtaps,
                          cutoff=self.cutoff,
                          width=self.width,
                          fs=self.sample_rate,
                          pass_zero=True).astype(np.complex64)
        samples = np.convolve(samples, h, 'valid')
        samples_list = samples.view(dtype=np.float32).tolist() # convert to I,Q,I,Q for JSON sake
        samples_obj = {"samples": samples_list,
                       "sample_rate": self.sample_rate,
                       "center_freq": self.center_freq,
                       "data_type": "iq/cf32_le"}
        return {
            "status" : "SUCCESS",
            "data_output" : [samples_obj],
            "annotations" : []
        }