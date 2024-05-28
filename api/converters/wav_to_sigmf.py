from sigmf import SigMFFile
from scipy.io import wavfile
import numpy as np

def wav_to_sigmf(wav_file_path: str) -> list[str]:
    """Convert a wav file to a sigmf file."""

    sample_rate, data = wavfile.read(wav_file_path)

    dest_path = wav_file_path.split(".")[0]

    if len(data.shape) == 2:
        samples = data[:, 0].astype(np.float32) + 1j * data[:, 1].astype(np.float32)
    else:  # only one channel (eg mono audio)
        samples = data.astype(np.float32)
    samples.astype(np.complex64)
    samples /= 32767.0
    samples.tofile(f"{dest_path}.sigmf-data")

    meta = SigMFFile(
        data_file=f"{dest_path}.sigmf-data",
        global_info={
            SigMFFile.DATATYPE_KEY: "cf32_le",
            SigMFFile.SAMPLE_RATE_KEY: sample_rate,
            SigMFFile.VERSION_KEY: "1.0.0",
            SigMFFile.NUM_CHANNELS_KEY: 1,
        }
    )

    meta.tofile(f"{dest_path}.sigmf-meta")
    return [f"{dest_path}.sigmf-data", f"{dest_path}.sigmf-meta"]


# This will create the sigmf-data and meta files wherever the wav file was
# eg:
# python api/converters/wav_to_sigmf.py test.wav
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("wav_file")
    args = parser.parse_args()

    wav_to_sigmf(args.wav_file)
    print("DONE")
