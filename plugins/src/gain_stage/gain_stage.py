# Copyright (c) 2023 Marc Lichtman.
# Licensed under the MIT License.

import base64
import numpy as np
from pydantic.dataclasses import dataclass
from models.plugin import Plugin


class gain_stage(Plugin):
    sample_rate: int = 0
    center_freq: int = 0

    # custom params
    gain: float = 1

    def rf_function(self, samples, job_id=None):
        samples = samples * self.gain

        samples_obj = {
            "samples": base64.b64encode(samples),
            "sample_rate": self.sample_rate,
            "center_freq": self.center_freq,
            "data_type": "iq/cf32_le",
        }
        return {"data_output": [samples_obj], "annotations": []}
