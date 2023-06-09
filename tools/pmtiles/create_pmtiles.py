# View with https://protomaps.github.io/PMTiles/
# Uses PMTiles archive format https://github.com/protomaps/PMTiles

from pmtiles.tile import zxy_to_tileid, tileid_to_zxy, TileType, Compression
from pmtiles.writer import Writer
import numpy as np
import io
import skimage.measure
from PIL import Image
import os

filename = '/mnt/c/Users/marclichtman/Downloads/ism_band_24.sigmf-data'
dtype = np.int16 # np.float32
fft_size = 16384
initial_decimation = 4 # this should represent the most zoomed in level you want to achieve
#        layer  0  1   2  3  4  5
decimations = [-1, -1, 8, 4, 2, 1]
max_layer = 5 # inclusive
min_layer = 2 # 0 is the first allowable layer, max zoomed out, its just 1 tile

spectrogram_decim_list = ()
file_split = 100 # to be able to process huge files without having the whole thing in memory
if dtype == np.int16:
    block_len = os.path.getsize(filename) / 2 / file_split # needs to be item size so fromfile() works properly
elif dtype == np.float32:
    block_len = os.path.getsize(filename) / 4 / file_split
else:
    print("invalid datatype")
    exit()
block_len = int(np.floor(block_len))
if block_len % 2 == 1: # IQIQIQIQ
    block_len -= 1

for i in range(file_split):
    print(str(i/file_split * 100) + '%')
    # Read in samples from binary IQ file
    samples = np.fromfile(filename, dtype=dtype, count=block_len, offset=block_len*i) / 32000
    samples = samples[::2] + 1j*samples[1::2]

    # Calc spectrogram
    num_rows = len(samples) // fft_size
    spectrogram = np.zeros((num_rows, fft_size))
    for i in range(num_rows):
        spectrogram[i,:] = 10*np.log10(np.abs(np.fft.fftshift(np.fft.fft(samples[i*fft_size:(i+1)*fft_size])))**2)

    # Scale to uint8 (0-255)
    spectrogram -= (np.min(spectrogram) + 20)
    spectrogram /= np.max(spectrogram)
    spectrogram *= 255
    spectrogram = np.uint8(spectrogram)

    # Decimate using initial decimation
    spectrogram_decim = skimage.measure.block_reduce(spectrogram, (initial_decimation, initial_decimation), np.max)
    spectrogram_decim_list = spectrogram_decim_list + (spectrogram_decim, )

spectrogram = np.concatenate(spectrogram_decim_list, axis=0)

with open("spectrogram.pmtiles", "wb") as f:
    writer = Writer(f)

    for layer in range(min_layer, max_layer + 1):
        print("starting layer", layer)
        x_len = spectrogram.shape[1] // 2**layer
        y_len = spectrogram.shape[0] // 2**layer
        for tileid in range(zxy_to_tileid(layer, 0, 0), zxy_to_tileid(layer+1, 0, 0)):
            z, x, y = tileid_to_zxy(tileid)
            print('tileid:', tileid, '   x,y,z:', x, y, z)
            spectrogram_piece = spectrogram[y*y_len:(y+1)*y_len, x*x_len:(x+1)*x_len]
            spectrogram_decimated = skimage.measure.block_reduce(spectrogram_piece, (decimations[layer], decimations[layer]), np.max)
            img = Image.fromarray(spectrogram_decimated, 'L') # L means 8 bit greyscale
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format='PNG')
            writer.write_tile(tileid, img_byte_arr.getvalue())

    writer.finalize(
        {
            "tile_type": TileType.PNG,
            "tile_compression": Compression.NONE,
            "min_zoom": min_layer,
            "max_zoom": max_layer,
            "min_lon_e7": int(-90e7),
            "min_lat_e7": int(-90e7), 
            "max_lon_e7": int(90e7),
            "max_lat_e7": int(90e7),
            "center_zoom": 0,
            "center_lon_e7": 0,
            "center_lat_e7": 0,
        },
        {
            "attribution": 'Created for use in IQEngine'
        },
    )