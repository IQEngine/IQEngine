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

    if data_type == "ci16_le" or data_type == "ci16" or data_type == "ci16_be":
        samples = np.frombuffer(data_bytes, dtype=np.int16)
        samples = samples[::2] + 1j * samples[1::2]
    elif data_type == "cf32_le" or data_type == "cf32" or data_type == "cf32_be":
        samples = np.frombuffer(data_bytes, dtype=np.complex64)
    elif data_type == "ci8" or data_type == "i8":
        samples = np.frombuffer(data_bytes, dtype=np.int8)
        samples = samples[::2] + 1j * samples[1::2]
    else:
        raise ("Datatype " + data_type + " not implemented")
    return samples


def get_bytes_per_iq_sample(data_type):
    """
    Get the number of bytes per I+Q sample.

    Parameters
    ----------
    data_type : str
        The data type of the bytes.


    Returns
    -------
    int
        The number of bytes per I+Q sample.
    """
    if data_type == "cf32_le" or data_type == "cf32" or data_type == "cf32_be":
        return 8
    elif data_type == "ci16_le" or data_type == "ci16" or data_type == "ci16_be":
        return 4
    elif data_type == "ci8" or data_type == "i8":
        return 2
    else:
        raise ValueError("Datatype " + data_type + " not implemented")


def get_sample_length_from_byte_length(byte_length: int, data_type: str):
    """
    Get the number of samples from the number of bytes. those samples are in I+Q format.
    so they actually use 2 numbers in the files.

    Parameters
    ----------
    byte_length : int
        The number of bytes.
    data_type : str
        The data type of the bytes.

    Returns
    -------
    int
        The number of samples.
    """
    return byte_length // get_bytes_per_iq_sample(data_type)
