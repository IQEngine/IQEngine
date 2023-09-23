import io
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image
from .samples import get_samples

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
        spectrogram[i, :] = 10*np.log10(np.abs(np.fft.fftshift(np.fft.fft(samples[i * fftSize : (i + 1) * fftSize])))**2)
    fig = plt.figure(frameon=False)
    ax = plt.Axes(fig, [0.0, 0.0, 1.0, 1.0])
    ax.set_axis_off()
    fig.add_axes(ax)
    ax.imshow(
        spectrogram, cmap=cmap, aspect="auto", vmin=30 + np.min(np.min(spectrogram))
    )
    img_buf = io.BytesIO()
    plt.savefig(img_buf, bbox_inches="tight", pad_inches=0)
    img_buf.seek(0)
    im = Image.open(img_buf)
    img_byte_arr = io.BytesIO()
    im.convert("RGB").save(img_byte_arr, format=format)
    data = img_byte_arr.getvalue()
    return data
