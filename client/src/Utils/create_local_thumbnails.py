# Copyright (c) 2022 Microsoft Corporation
# Copyright (c) 2023 Marc Lichtman
# Licensed under the MIT License

import numpy as np
import matplotlib.pyplot as plt
import os
import io
import json
from PIL import Image

num_bytes = 1000000
offset = 0
fftSize = 1024

def spectro_maker(directory, basename):

    metaname = basename + ".sigmf-meta"
    dataname = basename + ".sigmf-data"
    metaFile = directory + "\\" + metaname
    dataFile = directory + "\\" +  dataname

    if ((not os.path.exists(metaFile)) or (not os.path.exists(dataFile))):
        #print("Either meta or data file does not exist")
        return   

    print("Creating png for", directory, basename)

    with open(metaFile, "r") as f:
        meta_data = json.loads(f.read())
    with open(dataFile, "rb") as f:
        bytes = f.read()
    meta_data_global = meta_data.get("global", {})
    datatype =  meta_data_global.get("core:datatype", 'cf32_le')
    sample_rate = float(meta_data_global.get("core:sample_rate", 0))/1e6 # MHz
    center_freq = float(meta_data.get("captures", [])[0].get("core:frequency", 0))/1e6 # MHz
    
    if datatype == 'cf32_le':
        samples = np.frombuffer(bytes, dtype=np.complex64)
    elif datatype == 'ci16_le':
        samples = np.frombuffer(bytes, dtype=np.int16)
        samples = samples[::2] + 1j*samples[1::2]
    elif datatype == 'ri16_le':
        samples = np.frombuffer(bytes, dtype=np.int16)
    else:
        print("Datatype not implemented")
        samples = np.zeros(1024)

    # Generate spectrogram
    num_rows = int(np.floor(len(samples)/fftSize))
    spectrogram = np.zeros((num_rows, fftSize))
    for i in range(num_rows):
        spectrogram[i,:] = np.log10(np.abs(np.fft.fftshift(np.fft.fft(samples[i*fftSize:(i+1)*fftSize])))**2)

    fig = plt.figure()
    ax = fig.add_subplot(1,1,1)
    ax.imshow(spectrogram, aspect='auto', extent = [sample_rate/-2 + center_freq, sample_rate/2 + center_freq, 0, len(samples)/sample_rate])
    plt.axis('off')
    plt.grid(False)
    img_buf = io.BytesIO()
    plt.savefig(img_buf, bbox_inches='tight', pad_inches = 0)
    img_buf.seek(0)
    im = Image.open(img_buf)

    img_byte_arr = io.BytesIO()
    im.convert("RGB").save(img_byte_arr, format = 'png')
    output = f"{basename}.png"
    im.save(directory + "\\" + output)
    #print("New image saved")

def file_parsing(dir, filename):
    extension = filename.split(".")[1]
    basename = filename.split(".")[0]
    if ((extension != "sigmf-meta") and (extension != "sigmf-data")):
        #print("extension not correct")
        return   
    elif (extension == "sigmf-meta"):   
        spectro_maker(dir, basename)


def sub_dir_check(directory):
    for filename in os.listdir(directory):
        f = os.path.join(directory, filename)
        #print(f)
        if os.path.isdir(f):
            sub_dir_check(directory + "\\" + filename)
        elif os.path.isfile(f):
            file_parsing(directory, filename)
        else:
            return


directory = input("Enter your desired directory: ")
for filename in os.listdir(directory):
    f = os.path.join(directory, filename)
    # checking if it is a file
    if os.path.isdir(f):
        sub_dir_check(directory + "\\" + filename)
    else:
        file_parsing(directory, filename)

