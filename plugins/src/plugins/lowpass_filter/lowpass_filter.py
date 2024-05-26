import base64

import fastapi
import numpy as np
from models.models import MetadataFile, Output
from models.plugin import Plugin
from scipy import signal


class lowpass_filter(Plugin):
    sample_rate: int = 0
    center_freq: int = 0

    # custom params
    numtaps: int = 51
    cutoff: float = 1e6  # relative to sample rate
    width: float = 0.1e6  # relative to sample rate

    def rf_function(self, samples, job_context=None):
        if self.numtaps > 10000:
            raise fastapi.HTTPException(status_code=500, detail="too many taps")
        if np.abs(self.width) > self.sample_rate / 2:
            raise fastapi.HTTPException(status_code=500, detail="width needs to be less than sample_rate/2")

        h = signal.firwin(
            self.numtaps,
            cutoff=self.cutoff,
            width=self.width,
            fs=self.sample_rate,
            pass_zero=True,
        ).astype(np.complex64)

        samples = np.convolve(samples, h, "valid")
        samples_bytes = samples.tobytes()
        samples_b64 = base64.b64encode(samples_bytes).decode()

        metadata = MetadataFile(
            file_name=job_context.file_name,
            data_type="iq/cf32_le",
            sample_rate=self.sample_rate,
            center_freq=self.center_freq,
        )

        return Output(metadata_file=metadata, output_data=samples_b64)
