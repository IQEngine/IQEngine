# Copyright (c) 2023 Marc Lichtman.
# Licensed under the MIT License.

import base64

import numpy as np
from scipy import signal
from scipy.io.wavfile import write
import io
import json
from models.plugin import Plugin
from models.models import Output, DataObject

class fm_receiver(Plugin):
    sample_rate: int = 0
    center_freq: int = 0

    # custom params
    target_freq: float = 0

    def rf_function(self, samples, job_context=None):
        # Freq shift if desired
        if self.target_freq != 0:
            samples = samples * np.exp(-2j * np.pi * self.target_freq * np.arange(len(samples)) / self.sample_rate)

        # Low pass filter to isolate FM signal
        h = signal.firwin(101, cutoff=150e3, fs=self.sample_rate).astype(np.complex64)
        samples = np.convolve(samples, h, "valid")

        samples = signal.resample_poly(samples, 10, int(self.sample_rate / 500e3 * 10))  # 500 kHz is the target

        samples = np.diff(np.unwrap(np.angle(samples)))  # Demodulation

        # De-emphasis filter, H(s) = 1/(RC*s + 1), implemented as IIR via bilinear transform
        bz, az = signal.bilinear(1, [75e-6, 1], fs=self.sample_rate)
        samples = signal.lfilter(bz, az, samples)

        # decimate by 10 to get mono audio close to 48 kHz
        samples = samples[::10]

        # normalize volume so its between -1 and +1
        samples /= np.max(np.abs(samples))

        # some machines want int16s
        samples *= 32767
        samples = samples.astype(np.int16)

        # Also save to file, for testing
        if False:
            write('test.wav', 48000, samples)

        # Create wav file out of real samples
        byte_io = io.BytesIO(bytes())
        write(byte_io, 48000, samples)

        output_data = DataObject(data_type='audio/wav', file_name='output.wav', data=base64.b64encode(byte_io.getvalue()).decode())
        return Output(non_iq_output_data=output_data)


if __name__ == "__main__":
    fname = "/mnt/c/Users/marclichtman/Downloads/analog_FM_France"  # base name
    with open(fname + '.sigmf-meta', 'r') as f:
        meta_data = json.load(f)
    sample_rate = meta_data["global"]["core:sample_rate"]
    print(sample_rate)
    center_freq = meta_data["captures"][0]['core:frequency']
    samples = np.fromfile(fname + '.sigmf-data', dtype=np.complex64)
    params = {'sample_rate': sample_rate, 'center_freq': center_freq, 'target_freq': 0}
    detector = Plugin(**params)
    detector.run(samples)
