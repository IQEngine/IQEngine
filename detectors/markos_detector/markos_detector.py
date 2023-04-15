# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

import numpy as np
from matplotlib import pyplot as plt
from matplotlib.patches import Rectangle
from collections import deque
import time
import cv2 as cv
import json

def detect(samples, sample_rate, center_freq, detector_settings):
    time_window_size = detector_settings.get('time_window_size', 10)
    noise_params = get_noise_floor(samples, sample_rate, n_floor_window_bins=time_window_size)
    start_time = time.time()
    anots = highlight_energy(samples=samples,
                             samp_rate=sample_rate,
                             fft_size=1024,
                             window_size=time_window_size,
                             noise_power=noise_params['min_pwr'],
                             pwr_thresh_db=detector_settings.get('power_threshold_db', 20),
                             time_margin=detector_settings.get('time_margin_seconds', 0.001),
                             center_freq=center_freq,
                             min_bw=detector_settings.get('min_bw', 10e3))
    print(f"detection took {time.time() - start_time} seconds")

    rects = []
    for a in anots:
        td = {'start_samp':a['core:sample_start'],'end_samp':a['core:sample_start']+a['core:sample_count'],'start_freq':a['core:freq_lower_edge']-center_freq,'end_freq': a['core:freq_upper_edge']-center_freq, 'min_pwr':123}
        rects.append(td)

    # Creates spectrogram with rectangles and saves to png file
    if False:
        plot_spectrogram(samples, sample_rate, rects)

    return anots

def get_noise_floor(samps, sample_rate, fft_size=1024, n_floor_window_bins=10, n_random_spots=5):
    # this function does an fft of size {fft_size} at {n_random_spots} different locations
    # it then looks for the set of {n_floor_window_bins} contiguous bins in any of those ffts which has the
    # lowest total power which are then assumed to be "the noise floor"
    # returns a tuple of the start idx in time where the floor was found, the freq range, and the avg bin power
    #print(f"got {len(samps)} samples in")
    fft_locs = (np.random.rand(n_random_spots) * (len(samps) - fft_size)).astype(int)
    #print(f"will take ffts at {fft_locs}")
    min_pwr = float('inf')
    for fft_loc in fft_locs:
        time_slice_samps = samps[fft_loc:fft_loc + fft_size]
        fft_samps = np.fft.fft(time_slice_samps)
        shifted_fft = np.fft.fftshift(fft_samps)
        for idx in range(fft_size - n_floor_window_bins):
            window_samps = shifted_fft[idx:idx + n_floor_window_bins]
            pwr = np.sum(np.square(np.abs(window_samps)))
            if pwr < min_pwr:
                min_pwr = pwr
                freq_list = np.fft.fftfreq(fft_size, 1.0/sample_rate)
                freq_list = np.fft.fftshift(freq_list)
                res = {'start_samp':fft_loc,'end_samp':fft_loc+fft_size,'start_freq':freq_list[idx],'end_freq': freq_list[idx+n_floor_window_bins], 'min_pwr':min_pwr}
    return res

def plot_spectrogram(x, sample_rate, box_params=None):
    fft_size = 1024
    num_rows = int(np.floor(len(x)/fft_size))
    spectrogram = np.zeros((num_rows, fft_size))
    for i in range(num_rows):
        spectrogram[i,:] = 10*np.log10(np.abs(np.fft.fftshift(np.fft.fft(x[i*fft_size:(i+1)*fft_size])))**2)

    plt.imshow(spectrogram, aspect='auto', extent = [-sample_rate/2e6, sample_rate/2e6, 0, len(x)/sample_rate])

    plt.xlabel("Frequency [MHz]")
    plt.ylabel("Time [s]")
    if isinstance(box_params,list):
        ax = plt.gca()
        for bp in box_params:
            start_samp,end_samp = bp['start_samp'], bp['end_samp']
            start_freq,end_freq = bp['start_freq'], bp['end_freq']
            start_freq = start_freq / 1e6
            end_freq = end_freq / 1e6
            start_time = 1.0*start_samp/sample_rate
            end_time = 1.0*end_samp/sample_rate
            freq_width = (end_freq - start_freq)
            box_duration = (end_time-start_time)
            rect = Rectangle((start_freq,start_time),freq_width,box_duration,linewidth=1,edgecolor='r',facecolor='none')
            ax.add_patch(rect)
    plt.savefig('annotated_spectrogram.png')

def highlight_energy(samples, samp_rate, fft_size, window_size, noise_power, pwr_thresh_db, time_margin, center_freq, min_bw):
    #samples: IQ samples
    #samp_rate: samp_rate
    #fft_size: fft_size for processing
    #window_size: window size for power level determination
    #noise_power: reference power for comparison to determine if above threshold
    #pwr_thresh_db: db above noise power required to be classified as a signal
    #time_margin: time before and after actual power detected to be included as part of annotation

    num_rows = int(np.floor(len(samples)/fft_size))
    detections = np.zeros((num_rows, fft_size - window_size))
    pwr_thresh_lin = np.power(10,pwr_thresh_db/10.0)
    fft_duration = fft_size / samp_rate
    bin_spacing = 1 / fft_duration
    #step 1: find indices above threshold
    for row_idx in range(num_rows):
        row_fft = np.fft.fft(samples[row_idx*fft_size: row_idx*fft_size + fft_size])
        row_fft = np.fft.fftshift(row_fft)
        pwr_row = np.square(np.abs(row_fft))
        window_samps = deque(list(row_fft[:window_size-1]),maxlen=window_size)
        for idx in range(fft_size - window_size):
            window_samps.append(pwr_row[idx+window_size])
            window_power = np.sum(window_samps)
            if window_power / noise_power > pwr_thresh_lin:
                detections[row_idx][idx] = 1
    #plt.imshow(detections, aspect='auto', extent = [-samp_rate/2e6, samp_rate/2e6, 0, len(detections)/samp_rate])
    #plt.show()
    #step2: time domain smooth
    n_fft_time_smooth = max(int(round(time_margin / fft_duration)),1)
    td_window = np.ones(n_fft_time_smooth)
    smooth_det = np.zeros_like(detections)
    for col_idx in range(num_rows):
        col = detections[:, col_idx]
        np.reshape(col, len(col))
        new_col = np.convolve(col,td_window)[:len(col)]
        smooth_det[:,col_idx] = new_col
    
    gray_smooth = smooth_det.astype(np.uint8)
    print(f"mean: {np.mean(gray_smooth)}, max:{np.max(gray_smooth)}")
    gray_smooth = (gray_smooth * 255 / np.max(gray_smooth)).astype('uint8')
    threshold = 127 # TWEAKABLE PARAM
    _, thresh = cv.threshold(gray_smooth, threshold, 255, 0) 
    if False:
        cv.imwrite('thresh.png',thresh)
    contours, _ = cv.findContours(thresh, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE)
    
    print(f"got this many contours: {len(contours)}")
    backtorgb = cv.cvtColor(thresh,cv.COLOR_GRAY2RGB)
    #cv.drawContours(backtorgb, contours, -1, (0,255,0), 3)
    rectangles = []
    for ct in contours:
        x,y,w,h = cv.boundingRect(ct)
        rectangles.append((x,y,w,h))
    
    #remove little rectangles inside of larger ones
    cleaned_rectangles = []
    for ri in range(len(rectangles)):
        sits_in_another_rectangle = False
        for ri2 in range(len(rectangles)):
            if ri != ri2:
                (x1,y1,w1,h1) = rectangles[ri]
                (x2,y2,w2,h2) = rectangles[ri2]
                if x1 >= x2 and x1 <= (x2+w2) and y1 >= y2 and y1 <= (y2+h2) and w1*h1 < w2*h2:
                    sits_in_another_rectangle = True
        if not sits_in_another_rectangle:
            cleaned_rectangles.append(rectangles[ri])
    #remove rectangles smaller than min bw
    cr = []
    min_bw_w = min_bw / bin_spacing
    for (x,y,w,h) in cleaned_rectangles:
        if w >= min_bw_w:
            cr.append((x,y,w,h))
    cleaned_rectangles = cr
    annotations = []

    for (x,y,w,h) in cleaned_rectangles:
        cv.rectangle(backtorgb,(x,y),(x+w,y+h),(0,255,0),2)
        
        an = {}
        an['core:freq_lower_edge'] = (samp_rate / fft_size) * x - (samp_rate / 2.0) + center_freq
        an['core:freq_upper_edge'] = (samp_rate / fft_size) * (x + w) - (samp_rate / 2.0) + center_freq
        an['core:sample_start'] = y * fft_size
        an['core:sample_count'] = h * fft_size
        an["core:description"] = "Unknown"
        annotations.append(an)

    if False:
        cv.imwrite('thresh_cont.png', backtorgb)
    return annotations


if __name__ == "__main__":
    fname = "C:\\Users\\marclichtman\\Downloads\\synthetic"
    with open(fname + '.sigmf-meta', 'r') as f:
        meta_data = json.load(f)
    sample_rate = meta_data["global"]["core:sample_rate"]
    center_freq = meta_data["captures"][0]['core:frequency']
    samples = np.fromfile(fname + '.sigmf-data', dtype=np.complex64)

    detector_settings = {'time_window_size': 10, 'power_threshold_db': 20, 'time_margin_seconds': 0.001, 'min_bw': 10e3}

    annotations = detect(samples, sample_rate, center_freq, detector_settings)
    print(annotations)