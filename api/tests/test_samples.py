import numpy as np
import pytest
from rf.samples import get_samples


def test_get_samples_i8():
    data_bytes = b"\x00\x01\x02\x03\x04\x05\x06\x07"
    data_type = "i8"
    expected_output = np.array([0 + 1j, 2 + 3j, 4 + 5j, 6 + 7j], dtype=np.complex64)
    assert np.array_equal(get_samples(data_bytes, data_type), expected_output)


def test_get_samples_u8():
    data_bytes = b"\x00\x01\x02\x03\x04\x05\x06\x07"
    data_type = "u8"
    expected_output = np.array([0 + 1j, 2 + 3j, 4 + 5j, 6 + 7j], dtype=np.complex64)
    assert np.array_equal(get_samples(data_bytes, data_type), expected_output)


def test_get_samples_ci16_le():
    data_bytes = b"\x00\x00\x01\x00\x02\x00\x03\x00"
    data_type = "ci16_le"
    expected_output = np.array([0 + 1j, 2 + 3j], dtype=np.complex64)
    assert np.array_equal(get_samples(data_bytes, data_type), expected_output)


def test_get_samples_cu16_le():
    data_bytes = b"\x00\x00\x01\x00\x02\x00\x03\x00"
    data_type = "cu16_le"
    expected_output = np.array([0 + 1j, 2 + 3j], dtype=np.complex64)
    assert np.array_equal(get_samples(data_bytes, data_type), expected_output)


def test_get_samples_cu32_le():
    data_bytes = b"\x00\x00\x00\x00\x01\x00\x00\x00\x02\x00\x00\x00\x03\x00\x00\x00"
    data_type = "cu32_le"
    expected_output = np.array([0 + 1j, 2 + 3j], dtype=np.complex64)
    assert np.array_equal(get_samples(data_bytes, data_type), expected_output)


def test_get_samples_cf32_le():
    data_bytes = b"\x00\x00\x80\x3f\x00\x00\x80\x3f\x00\x00\x80\x3f\x00\x00\x80\x3f"
    data_type = "cf32_le"
    expected_output = np.array([1 + 1j, 1 + 1j], dtype=np.complex64)
    assert np.array_equal(get_samples(data_bytes, data_type), expected_output)


def test_get_samples_cf64_le():
    data_bytes = b"\x00\x00\x00\x00\x00\x00\xf0\x3f\x00\x00\x00\x00\x00\x00\xf0\x3f"
    data_type = "cf64_le"
    expected_output = np.array([1 + 1j], dtype=np.complex128)
    assert np.array_equal(get_samples(data_bytes, data_type), expected_output)


def test_get_samples_invalid_datatype():
    data_bytes = b"\x00\x01\x02\x03\x04\x05\x06\x07"
    data_type = "invalid"
    with pytest.raises(ValueError):
        get_samples(data_bytes, data_type)
