import numpy as np
import io
import matplotlib.pyplot as plt
from PIL import Image

def get_samples(data_bytes, data_type) -> np.ndarray:
    if data_type == "ci8" or data_type == "ci8_le" or data_type == "i8":
        samples = np.frombuffer(data_bytes, dtype=np.int8)
        samples = samples[::2] + 1j * samples[1::2]
    elif data_type == "cu8" or data_type == "cu8_le" or data_type == "u8":
        samples = np.frombuffer(data_bytes, dtype=np.uint8)
        samples = samples[::2] + 1j * samples[1::2]
    elif data_type == "ci16" or data_type == "ci16_le":
        samples = np.frombuffer(data_bytes, dtype=np.int16)
        samples = samples[::2] + 1j * samples[1::2]
    elif data_type == "cu16" or data_type == "cu16_le":
        samples = np.frombuffer(data_bytes, dtype=np.uint16)
        samples = samples[::2] + 1j * samples[1::2]
    elif data_type == "cu32" or data_type == "cu32_le":
        samples = np.frombuffer(data_bytes, dtype=np.uint32)
        samples = samples[::2] + 1j * samples[1::2]
    elif data_type == "f16" or data_type == "f16_le":
        samples = np.frombuffer(data_bytes, dtype=np.float16)
        samples = samples[::2] + 1j * samples[1::2]
    elif data_type == "f32" or data_bytes == "f32_le":
        samples = np.frombuffer(data_bytes, dtype=np.float32)
        samples = samples[::2] + 1j * samples[1::2]
    elif data_type == "cf32_le" or data_type == "cf32":
        samples = np.frombuffer(data_bytes, dtype=np.complex64)
    elif data_type == "cf64_le" or data_type == "cf64":
        samples = np.frombuffer(data_bytes, dtype=np.complex128)
    else:
        raise ValueError("Datatype " + data_type + " not implemented")
    return samples

def get_bytes_per_iq_sample(data_type):
    if "64" in data_type:
        return 16
    elif "32" in data_type:
        return 8
    elif "16" in data_type:
        return 4
    elif "8" in data_type:
        return 2
    else:
        raise ValueError("within get_bytes_per_iq_sample, didn't see 64 or 32 or 16 or 8")

def get_spectrogram_image(
    content: bytes,
    data_type: str,
    fftSize: int,
    cmap: str = "viridis",
    format: str = "jpeg",
) -> bytes:
    # Generate a spectrogram image from bytes, used for generating thumbnail
    samples = get_samples(content, data_type)
    num_rows = int(np.floor(len(samples) / fftSize))
    spectrogram = np.zeros((num_rows, fftSize))
    for i in range(num_rows):
        spectrogram[i, :] = 10 * np.log10(np.abs(np.fft.fftshift(np.fft.fft(samples[i * fftSize: (i + 1) * fftSize])))**2)
    fig = plt.figure(frameon=False)
    ax = plt.Axes(fig, [0.0, 0.0, 1.0, 1.0])
    ax.set_axis_off()
    fig.add_axes(ax)
    ax.imshow(spectrogram, cmap=cmap, aspect="auto", vmin=30 + np.min(np.min(spectrogram)))
    img_buf = io.BytesIO()
    plt.savefig(img_buf, bbox_inches="tight", pad_inches=0)
    img_buf.seek(0)
    im = Image.open(img_buf)
    img_byte_arr = io.BytesIO()
    im.convert("RGB").save(img_byte_arr, format=format)
    return img_byte_arr.getvalue()
