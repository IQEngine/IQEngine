# Copyright (c) 2023 Marc Lichtman.
# Licensed under the MIT License.

import numpy as np
import json
from pydantic.dataclasses import dataclass
import cv2

@dataclass
class Plugin:
    sample_rate: int = 0
    center_freq: int = 0

    # Custom Params
    threshold_dB: float = 40.0


    def run(self, samples):
        #print(samples[0:10])
        #print(self.sample_rate)
        #print(self.center_freq)
        #print(self.threshold_dB)

        # Your detection (and optionally, classification) code here
        fft_size = 1024
        num_rows = int(np.floor(len(samples)/fft_size))
        spectrogram = np.zeros((num_rows, fft_size))
        for i in range(num_rows):
            spectrogram[i,:] = 10*np.log10(np.abs(np.fft.fftshift(np.fft.fft(samples[i*fft_size:(i+1)*fft_size])))**2)
        noise_level = np.mean(np.min(spectrogram, axis=1)) # mean of the minimum from each fft after converting to dB
        threshold_level = noise_level + self.threshold_dB
        spectrogram_bool = spectrogram > threshold_level

        if False:
            import matplotlib.pyplot as plt
            plt.imshow(spectrogram_bool)
            plt.savefig('spectrogram_bool.png')

        image_8bit = np.uint8(spectrogram_bool * 255) # 0's and 255's

        threshold_level = 128 # arbitrary
        _, binarized = cv2.threshold(image_8bit, threshold_level, 255, cv2.THRESH_BINARY)
        contours, hierarchy = cv2.findContours(binarized, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Remove contours that are too small
        filtered_contours = []
        for contour in contours:
            x,y,w,h = cv2.boundingRect(contour)
            #print(x,y,w,h)
            if w > 20 and h > 20:
                filtered_contours.append(contour)

        print("num contours found:", len(filtered_contours))  # goal is 14 for the synthetic test file

        if False:
            backtorgb = cv2.cvtColor(binarized, cv2.COLOR_GRAY2RGB) # need the image to be RGB to have color bounding boxes
            img = cv2.drawContours(backtorgb, filtered_contours, -1, (0, 0, 255), 3)
            cv2.imwrite('contours.png', img)

        annotations = []
        for contour in filtered_contours:
            x,y,w,h = cv2.boundingRect(contour)
            an = {}
            an['core:freq_lower_edge'] = int(x / fft_size * self.sample_rate - (self.sample_rate / 2) + self.center_freq) # Hz
            an['core:freq_upper_edge'] = int((x + w) / fft_size * self.sample_rate - (self.sample_rate / 2) + self.center_freq) # Hz
            an['core:sample_start'] = int(y * fft_size)
            an['core:sample_count'] = int(h * fft_size)
            an["core:label"] = "Unknown"
            annotations.append(an)

        return {
            "status" : "SUCCESS",
            "data_output" : [],
            "annotations" : annotations
        }

if __name__ == "__main__":
    # Example of how to test your detector locally
    fname = "/mnt/c/Users/marclichtman/Downloads/synthetic" # base name
    with open(fname + '.sigmf-meta', 'r') as f:
        meta_data = json.load(f)
    sample_rate = meta_data["global"]["core:sample_rate"]
    center_freq = meta_data["captures"][0]['core:frequency']
    samples = np.fromfile(fname + '.sigmf-data', dtype=np.complex64)
    #print(samples[0:10])
    params = {'sample_rate': sample_rate, 'center_freq': center_freq, 'threshold_dB': 40}
    detector = Plugin(**params)
    annotations = detector.run(samples)
    print(annotations)