from unittest import mock
from unittest.mock import AsyncMock

import numpy
import pytest
from app.models import DataSource
from azure.storage.blob import BlobProperties
from tests.test_data import test_datasource

test_binary = b"the quick brown fox jumps over the lazy dog"
test_blob_properties = BlobProperties()
test_blob_properties.size = 100


@mock.patch("app.iq_router.AzureBlobClient.get_file_length", return_value=100)
@mock.patch("app.iq_router.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_invalid_format(mock_decrypt, mock_get_file_length, client):
    """Get IQ data with invalid format. Returns 400."""
    from app import datasources

    client.app.dependency_overrides[datasources.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.int16).tobytes()
    format = "invalid"
    with mock.patch("app.azure_client.AzureBlobClient.get_blob_content", return_value=arr):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format={format}&block_size=1&block_indexes_str=1&filepath=test"
        )
        assert response.status_code == 400


async def mock_get_test_datasource():
    return DataSource(**test_datasource)


@mock.patch("app.iq_router.AzureBlobClient.get_file_length", return_value=100)
@mock.patch("app.iq_router.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_with_ci16_le(mock_decrypt, mock_get_file_length, client):
    """Get IQ data with iq16_le. Returns populated float of float array."""
    from app import datasources

    client.app.dependency_overrides[datasources.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.int16).tobytes()
    format = "ci16_le"
    with mock.patch("app.azure_client.AzureBlobClient.get_blob_content", return_value=arr):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format={format}&block_size=1&block_indexes_str=1&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == arr


@mock.patch("app.iq_router.AzureBlobClient.get_file_length", return_value=100)
@mock.patch("app.iq_router.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_with_ci16(mock_decrypt, mock_get_file_length, client):
    """Get IQ data with ci16. Returns populated float of float array."""
    from app import datasources

    client.app.dependency_overrides[datasources.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.int16).tobytes()
    format = "ci16"
    with mock.patch("app.azure_client.AzureBlobClient.get_blob_content", return_value=arr):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format={format}&block_size=1&block_indexes_str=1&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == arr


@mock.patch("app.iq_router.AzureBlobClient.get_file_length", return_value=100)
@mock.patch("app.iq_router.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_with_ci16_be(mock_decrypt, mock_get_file_length, client):
    """Get IQ data with ci16_be. Returns populated float of float array."""
    from app import datasources

    client.app.dependency_overrides[datasources.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.int16).tobytes()
    format = "ci16_be"
    with mock.patch("app.azure_client.AzureBlobClient.get_blob_content", return_value=arr):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format={format}&block_size=1&block_indexes_str=1&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == arr


@mock.patch("app.iq_router.AzureBlobClient.get_file_length", return_value=100)
@mock.patch("app.iq_router.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_with_cf32_le(mock_decrypt, mock_get_file_length, client):
    """Get IQ data with cf32_le. Returns populated float of float array."""
    from app import datasources

    client.app.dependency_overrides[datasources.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.float32).tobytes()
    format = "cf32_le"
    with mock.patch("app.azure_client.AzureBlobClient.get_blob_content", return_value=arr):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format={format}&block_size=1&block_indexes_str=1&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == arr


@mock.patch("app.iq_router.AzureBlobClient.get_file_length", return_value=100)
@mock.patch("app.iq_router.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_with_cf32(mock_decrypt, mock_get_file_length, client):
    """Get IQ data with cf32. Returns populated float of float array."""
    from app import datasources

    client.app.dependency_overrides[datasources.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.float32).tobytes()
    format = "cf32"
    with mock.patch("app.azure_client.AzureBlobClient.get_blob_content", return_value=arr):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format={format}&block_size=1&block_indexes_str=1&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == arr


@mock.patch("app.iq_router.AzureBlobClient.get_file_length", return_value=100)
@mock.patch("app.iq_router.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_with_cf32_be(mock_decrypt, mock_get_file_length, client):
    """Get IQ data with cf32_be. Returns populated float of float array."""
    from app import datasources

    client.app.dependency_overrides[datasources.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.float32).tobytes()
    format = "cf32_be"
    with mock.patch("app.azure_client.AzureBlobClient.get_blob_content", return_value=arr):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format={format}&block_size=1&block_indexes_str=1&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == arr


@mock.patch("app.iq_router.AzureBlobClient.get_file_length", return_value=100)
@mock.patch("app.iq_router.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_with_ci8(mock_decrypt, mock_get_file_length, client):
    """Get IQ data with ci8. Returns populated float of float array."""
    from app import datasources

    AsyncMock()
    client.app.dependency_overrides[datasources.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.int8).tobytes()
    format = "ci8"
    with mock.patch("app.azure_client.AzureBlobClient.get_blob_content", return_value=arr):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format={format}&block_size=1&block_indexes_str=1&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == arr


@mock.patch("app.iq_router.AzureBlobClient.get_file_length", return_value=100)
@mock.patch("app.iq_router.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_with_i8(mock_decrypt, mock_get_file_length, client):
    """Get IQ data with i8. Returns populated float of float array."""
    from app import datasources

    client.app.dependency_overrides[datasources.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.int8).tobytes()
    format = "i8"
    with mock.patch("app.azure_client.AzureBlobClient.get_blob_content", return_value=arr):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format={format}&block_size=1&block_indexes_str=1&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == arr


@mock.patch("app.iq_router.AzureBlobClient.get_file_length", return_value=100)
@mock.patch("app.iq_router.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_with_multiple_arr_elements_returns_data(mock_decrypt, mock_get_file_length, client):
    """Get IQ data with i8. Returns populated float of float array."""
    from app import datasources

    client.app.dependency_overrides[datasources.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.int8).tobytes()
    input_arr_str = "1,3"
    with mock.patch("app.azure_client.AzureBlobClient.get_blob_content", return_value=arr):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format=i8&block_size=1&block_indexes_str={input_arr_str}&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == arr + arr


@mock.patch("app.iq_router.AzureBlobClient.get_file_length", return_value=2)
@mock.patch("app.iq_router.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_with_offset_larger_than_blob_size(mock_decrypt, mock_get_file_length, client):
    """Get IQ data with offset larger than blob size. Returns partially populated float of float array."""
    from app import datasources

    client.app.dependency_overrides[datasources.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.int8).tobytes()
    input_arr_str = "2"
    with mock.patch("app.azure_client.AzureBlobClient.get_blob_content", return_value=arr):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format=i8&block_size=1&block_indexes_str={input_arr_str}&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == b""


@mock.patch("app.iq_router.AzureBlobClient.get_file_length", return_value=3)
@mock.patch("app.iq_router.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_with_offset_plus_count_larger_than_blob_size(mock_decrypt, mock_get_file_length, client):
    """Get IQ data with offset plus count larger than blob size. Returns empty float of float array."""
    from app import datasources

    client.app.dependency_overrides[datasources.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.int8).tobytes()

    input_arr_str = "1"
    with mock.patch("app.azure_client.AzureBlobClient.get_blob_content", return_value=arr):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format=i8&block_size=1&block_indexes_str={input_arr_str}&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == arr
