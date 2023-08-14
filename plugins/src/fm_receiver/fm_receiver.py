# Copyright (c) 2023 Marc Lichtman.
# Licensed under the MIT License.

import base64

import numpy as np
from pydantic.dataclasses import dataclass
from scipy import signal
from scipy.io.wavfile import write
import io
import json

@dataclass
class Plugin:
    sample_rate: int = 0
    center_freq: int = 0

    # custom params
    target_freq: float = 0

    def run(self, x):
        # Freq shift if desired
        if self.target_freq != 0:
            x = x * np.exp(-2j * np.pi * self.target_freq * np.arange(len(x))/self.sample_rate)
        
        # Low pass filter to isolate FM signal
        h = signal.firwin(101, cutoff=150e3, fs=self.sample_rate).astype(np.complex64)
        x = np.convolve(x, h, "valid")

        x = signal.resample_poly(x, 10, int(self.sample_rate/500e3*10) ) # 500 kHz is the target
        
        x = np.diff(np.unwrap(np.angle(x))) # Demodulation

        # De-emphasis filter, H(s) = 1/(RC*s + 1), implemented as IIR via bilinear transform
        bz, az = signal.bilinear(1, [75e-6, 1], fs=self.sample_rate)
        x = signal.lfilter(bz, az, x)

        # decimate by 10 to get mono audio close to 48 kHz
        x = x[::10]

        # normalize volume so its between -1 and +1
        x /= np.max(np.abs(x))

        # some machines want int16s
        x *= 32767
        x = x.astype(np.int16)

        # Also save to file, for testing
        if False:
            write('test.wav', 48000, x)

        # Create wav file out of real samples
        byte_io = io.BytesIO(bytes())
        write(byte_io, 48000, x)

        samples_obj = {
            "samples": base64.b64encode(byte_io.read()),
            "data_type": "audio/wav",
        }
        return {"status": "SUCCESS", "data_output": [samples_obj], "annotations": []}


if __name__ == "__main__":
    fname = "/mnt/c/Users/marclichtman/Downloads/analog_FM_France" # base name
    with open(fname + '.sigmf-meta', 'r') as f:
        meta_data = json.load(f)
    sample_rate = meta_data["global"]["core:sample_rate"]
    print(sample_rate)
    center_freq = meta_data["captures"][0]['core:frequency']
    samples = np.fromfile(fname + '.sigmf-data', dtype=np.complex64)
    params = {'sample_rate': sample_rate, 'center_freq': center_freq, 'target_freq': 0}
    detector = Plugin(**params)
    detector.run(samples)
