# Copyright (c) 2023 Marc Lichtman.
# Licensed under the MIT License.

import numpy as np
import json
from pydantic.dataclasses import dataclass
#import matplotlib.pyplot as plt

@dataclass
class Plugin:
    sample_rate: int = 0
    center_freq: int = 0

    # Custom Params
    threshold_dB: float = 5.0

    def run(self, samples):
        fft_size = 2048
        num_rows = int(np.floor(len(samples)/fft_size))
        spectrogram = np.zeros((num_rows, fft_size))
        for i in range(num_rows):
            spectrogram[i,:] = 10*np.log10(np.abs(np.fft.fftshift(np.fft.fft(samples[i*fft_size:(i+1)*fft_size])))**2)
        psd = np.mean(spectrogram, axis=0)
        #plt.plot(psd)

        # Find index corresponding to center freq of all possible FM channels in both US and Europe (so every 100 kHz)
        channels = np.arange(87.9e6, 108.0e6, 0.1e6)
        channels = channels[channels >= (self.center_freq - self.sample_rate/2)]
        channels = channels[channels <= (self.center_freq + self.sample_rate/2)]
        #print("possible channels:", channels)
        metrics = []
        for channel in channels:
            # Do an energy detector using the FFT mags +/- 40 kHz around the center
            fmin = int(((channel - self.center_freq - 0.04e6) / self.sample_rate + 0.5) * fft_size)
            fmax = int(((channel - self.center_freq + 0.04e6) / self.sample_rate + 0.5) * fft_size)
            metrics.append(np.mean(psd[fmin:fmax]))
            #plt.plot([fmin, fmin], [0, 100], ':r')
            #plt.plot([fmax, fmax], [0, 100], 'g')

        threshold = np.min(metrics) + self.threshold_dB # dB
        #print("threshold:", threshold)

        #plt.plot(metrics, '.-')
        #plt.plot([0, len(metrics)], [threshold, threshold], '--r')
        #plt.show()

        detections = []
        for i in range(len(metrics)):
            current_max = np.argmax(metrics)
            if metrics[current_max] < threshold:
                print("done")
                break
            detections.append(channels[current_max])
            # Null out the current point as well as adjacent points because the FM signals span beyond the 100 kHz width
            metrics[current_max] = -10000
            if current_max > 0:
                metrics[current_max - 1] = -10000
            if current_max < len(metrics) - 1:
                metrics[current_max + 1] = -10000
        #print(detections)

        # Create list of SigMF annotations
        annotations = []
        for detection in detections:
            an = {}
            an['core:freq_lower_edge'] = detection - 0.1e6 # Hz
            an['core:freq_upper_edge'] = detection + 0.1e6 # Hz
            an['core:sample_start'] = 0
            an['core:sample_count'] = len(samples)
            an["core:label"] = "FM Radio"
            annotations.append(an)

        return {
            "status" : "SUCCESS",
            "data_output" : [],
            "annotations" : annotations
        }

if __name__ == "__main__":
    # Example of how to test your detector locally
    fname = "/mnt/c/Users/marclichtman/Downloads/analog_FM_France" # base name
    with open(fname + '.sigmf-meta', 'r') as f:
        meta_data = json.load(f)
    sample_rate = meta_data["global"]["core:sample_rate"]
    center_freq = meta_data["captures"][0]['core:frequency']
    samples = np.fromfile(fname + '.sigmf-data', dtype=np.complex64)
    params = {'sample_rate': sample_rate, 'center_freq': center_freq, 'threshold_dB': 5}
    detector = Plugin(**params)
    annotations = detector.run(samples)
    print(annotations)