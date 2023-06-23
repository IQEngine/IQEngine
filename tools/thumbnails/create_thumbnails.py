# Copyright (c) 2023 Marc Lichtman
# Licensed under the MIT License

import argparse
import io
import json

import matplotlib.pyplot as plt
import numpy as np
from azure.storage.blob import BlobServiceClient
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument("connectionstring")
args = parser.parse_args()

connection_string = args.connectionstring

fftSize = 1024
num_bytes = fftSize * 512
offset = (
    8000  # some might have a header from when they were converted to sigmf the lazy way
)

container_names = ["iqengine", "estevez", "northeastern"]


def spectro_maker(container_client, basename):
    metaname = basename + ".sigmf-meta"
    dataname = basename + ".sigmf-data"

    # Download data file
    try:
        data_bytes = container_client.download_blob(
            dataname, offset=offset, length=num_bytes
        ).readall()
    except Exception:
        print(basename + ".sigmf-data not found")
        return

    # Download meta file
    try:
        metainfo = container_client.download_blob(metaname).readall().decode("utf-8")
    except Exception:
        print(basename + ".sigmf-meta not found")
        return

    metainfo = json.loads(metainfo)

    dtype = metainfo["global"]["core:datatype"]
    if dtype == "ci16_le" or dtype == "ci16":
        samples = np.frombuffer(data_bytes, dtype=np.int16)
        samples = samples[::2] + 1j * samples[1::2]
    elif dtype == "cf32_le":
        samples = np.frombuffer(data_bytes, dtype=np.complex64)
    elif dtype == "ci8" or dtype == "i8":
        samples = np.frombuffer(data_bytes, dtype=np.int8)
        samples = samples[::2] + 1j * samples[1::2]
    else:
        print("Datatype " + dtype + " not implemented")
        return

    # Generate spectrogram
    num_rows = int(np.floor(len(samples) / fftSize))
    spectrogram = np.zeros((num_rows, fftSize))
    for i in range(num_rows):
        spectrogram[i, :] = 10 * np.log10(
            np.abs(
                np.fft.fftshift(np.fft.fft(samples[i * fftSize: (i + 1) * fftSize]))
            )
            ** 2
        )

    fig = plt.figure(frameon=False)
    ax = plt.Axes(fig, [0.0, 0.0, 1.0, 1.0])
    ax.set_axis_off()
    fig.add_axes(ax)
    ax.imshow(spectrogram, cmap="viridis", aspect="auto", vmin=30+np.min(np.min(spectrogram))) # used to be jet

    img_buf = io.BytesIO()
    plt.savefig(img_buf, bbox_inches="tight", pad_inches=0)
    img_buf.seek(0)
    im = Image.open(img_buf)
    img_byte_arr = io.BytesIO()
    im.convert("RGB").save(img_byte_arr, format="jpeg")
    data = img_byte_arr.getvalue()
    container_client.upload_blob(name=basename + ".jpeg", data=data, overwrite=True)
    print("Uploaded image!")
    plt.close()


if __name__ == "__main__":
    for container_name in container_names:
        blob_service_client = BlobServiceClient.from_connection_string(
            connection_string
        )
        container_client = blob_service_client.get_container_client(container_name)
        blob_list = container_client.list_blobs()
        for blob in blob_list:
            if "sigmf-meta" in blob.name:
                basename = blob.name.replace(".sigmf-meta", "")
                spectro_maker(container_client, basename)
