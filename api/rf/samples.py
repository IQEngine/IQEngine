import numpy as np


def get_samples(data_bytes, data_type) -> np.ndarray:
    """
    Get samples from bytes.

    Parameters
    ----------
    data_bytes : bytes
        The bytes to convert to samples.
    data_type : str
        The data type of the bytes.
        
    Returns
    -------
    np.ndarray
        The samples.
    """

    if data_type == "ci16_le" or data_type == "ci16":
        samples = np.frombuffer(data_bytes, data_type=np.int16)
        samples = samples[::2] + 1j * samples[1::2]
    elif data_type == "cf32_le":
        samples = np.frombuffer(data_bytes, data_type=np.complex64)
    elif data_type == "ci8" or data_type == "i8":
        samples = np.frombuffer(data_bytes, data_type=np.int8)
        samples = samples[::2] + 1j * samples[1::2]
    else:
        raise("Datatype " + data_type + " not implemented")        
    return samples