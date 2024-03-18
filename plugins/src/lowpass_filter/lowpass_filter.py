# Copyright (c) 2023 Marc Lichtman.
# Licensed under the MIT License.

import base64
import fastapi
import numpy as np
from scipy import signal
from models.plugin import Plugin

class lowpass_filter(Plugin):
    sample_rate: int = 0
    center_freq: int = 0

    # custom params
    numtaps: int = 51
    cutoff: float = 1e6  # relative to sample rate
    width: float = 0.1e6  # relative to sample rate

    def rf_function(self, samples, job_id=None):
        if self.numtaps > 10000:
            raise fastapi.HTTPException(status_code=500, detail="too many taps")
        if np.abs(self.width) > self.sample_rate/2:
            raise fastapi.HTTPException(status_code=500, detail="width needs to be less than sample_rate/2")

        h = signal.firwin(
            self.numtaps,
            cutoff=self.cutoff,
            width=self.width,
            fs=self.sample_rate,
            pass_zero=True,
        ).astype(np.complex64)

        samples = np.convolve(samples, h, "valid")

        samples_obj = {
            "samples": base64.b64encode(samples),
            "sample_rate": self.sample_rate,
            "center_freq": self.center_freq,
            "data_type": "iq/cf32_le",
        }
        return {"data_output": [samples_obj], "annotations": []}
