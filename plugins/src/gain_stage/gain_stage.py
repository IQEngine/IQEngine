# Copyright (c) 2023 Marc Lichtman.
# Licensed under the MIT License.

import base64
import fastapi
import numpy as np
from pydantic.dataclasses import dataclass
from scipy import signal


@dataclass
class Plugin:
    sample_rate: int = 0
    center_freq: int = 0

    # custom params
    gain: float = 1

    def run(self, samples):
        samples = samples * self.gain

        samples_obj = {
            "samples": base64.b64encode(samples),
            "sample_rate": self.sample_rate,
            "center_freq": self.center_freq,
            "data_type": "iq/cf32_le",
        }
        return {"data_output": [samples_obj], "annotations": []}
