import base64
from unittest import mock
from unittest.mock import AsyncMock, Mock

import numpy
import pytest
from azure.storage.blob import BlobProperties
from database import datasource_repo
from database.models import DataSource
from fastapi.testclient import TestClient
from tests.test_data import test_datasource, valid_metadata

test_binary = b"the quick brown fox jumps over the lazy dog"
test_blob_properties = BlobProperties()
test_blob_properties.size = 100


@mock.patch("handlers.iq.AzureBlobClient.set_sas_token", return_value=None)
@mock.patch("handlers.iq.AzureBlobClient.get_blob_content", return_value=test_binary)
@pytest.mark.asyncio
async def test_get_iq(mock_get_blob_content, mock_set_sas_token, client: TestClient):
    response = client.post("/api/datasources", json=test_datasource).json()
    response = client.post(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path/meta',
        json=valid_metadata,
    )

    response = client.get(
        f"/api/datasources/"
        f'{test_datasource["account"]}/{test_datasource["container"]}'
        f"/file_path/iqslice?offsetBytes=0&countBytes=10"
    )

    assert response.status_code == 200
    assert response.json() == {"data": base64.b64encode(test_binary).decode()}
    assert mock_get_blob_content.call_count == 1
    assert mock_get_blob_content.call_args[1]["offset"] == 0
    assert mock_get_blob_content.call_args[1]["length"] == 10
    assert mock_set_sas_token.call_count == 1


@mock.patch("handlers.iq.AzureBlobClient.set_sas_token", return_value=None)
@mock.patch("handlers.iq.AzureBlobClient.get_blob_content", return_value=test_binary)
@mock.patch(
    "handlers.iq.AzureBlobClient.get_blob_properties", return_value=test_blob_properties
)
@pytest.mark.asyncio
async def test_get_iq_data_slices(
    mock_set_sas_token: Mock,
    mock_get_blob_content: Mock,
    mock_get_blob_properties: Mock,
    client,
):
    mock_get_blob_properties.size = 100
    response = client.post("/api/datasources", json=test_datasource).json()
    response = client.post(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path/meta',
        json=valid_metadata,
    )

    response = client.post(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path/iqslices',
        json={"indexes": [0, 1, 2], "tile_size": 2, "bytes_per_iq_sample": 4},
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert mock_get_blob_content.call_count == 3
    assert mock_get_blob_content.call_args_list[0][1]["offset"] == 0
    assert mock_get_blob_content.call_args_list[0][1]["length"] == 8
    assert mock_get_blob_content.call_args_list[1][1]["offset"] == 8
    assert mock_get_blob_content.call_args_list[1][1]["length"] == 8
    assert mock_get_blob_content.call_args_list[2][1]["offset"] == 16
    assert mock_get_blob_content.call_args_list[2][1]["length"] == 8
    assert mock_set_sas_token.call_count == 1
    assert mock_get_blob_properties.call_count == 1


@mock.patch(
    "handlers.iq.AzureBlobClient.get_blob_properties", return_value=test_blob_properties
)
@mock.patch("handlers.iq.AzureBlobClient.get_file_length", return_value=100)
@mock.patch("handlers.iq.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_invalid_format(
    mock_decrypt, mock_get_file_length, mock_get_blob_properties, client
):
    """Get IQ data with invalid format. Returns 400."""
    client.app.dependency_overrides[datasource_repo.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.int16).tobytes()
    format = "invalid"
    with mock.patch(
        "blob.azure_client.AzureBlobClient.get_blob_content", return_value=arr
    ):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format={format}&block_size=1&block_indexes_str=1&filepath=test"
        )
        assert response.status_code == 400
        assert b"Datatype invalid not implemented" in response.content


async def mock_get_test_datasource():
    return DataSource(**test_datasource)


@mock.patch(
    "handlers.iq.AzureBlobClient.get_blob_properties", return_value=test_blob_properties
)
@mock.patch("handlers.iq.AzureBlobClient.get_file_length", return_value=100)
@mock.patch("handlers.iq.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_with_ci16_le(
    mock_decrypt, mock_get_file_length, mock_get_blob_properties, client
):
    """Get IQ data with iq16_le. Returns populated float of float array."""
    client.app.dependency_overrides[datasource_repo.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.int16).tobytes()
    format = "ci16_le"
    with mock.patch(
        "blob.azure_client.AzureBlobClient.get_blob_content", return_value=arr
    ):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format={format}&block_size=1&block_indexes_str=1&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == arr


@mock.patch(
    "handlers.iq.AzureBlobClient.get_blob_properties", return_value=test_blob_properties
)
@mock.patch("handlers.iq.AzureBlobClient.get_file_length", return_value=100)
@mock.patch("handlers.iq.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_with_ci16(
    mock_decrypt, mock_get_file_length, mock_get_blob_properties, client
):
    """Get IQ data with ci16. Returns populated float of float array."""
    client.app.dependency_overrides[datasource_repo.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.int16).tobytes()
    format = "ci16"
    with mock.patch(
        "blob.azure_client.AzureBlobClient.get_blob_content", return_value=arr
    ):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format={format}&block_size=1&block_indexes_str=1&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == arr


@mock.patch(
    "handlers.iq.AzureBlobClient.get_blob_properties", return_value=test_blob_properties
)
@mock.patch("handlers.iq.AzureBlobClient.get_file_length", return_value=100)
@mock.patch("handlers.iq.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_with_ci16_be(
    mock_decrypt, mock_get_file_length, mock_get_blob_properties, client
):
    """Get IQ data with ci16_be. Returns populated float of float array."""
    client.app.dependency_overrides[datasource_repo.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.int16).tobytes()
    format = "ci16_be"
    with mock.patch(
        "blob.azure_client.AzureBlobClient.get_blob_content", return_value=arr
    ):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format={format}&block_size=1&block_indexes_str=1&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == arr


@mock.patch(
    "handlers.iq.AzureBlobClient.get_blob_properties", return_value=test_blob_properties
)
@mock.patch("handlers.iq.AzureBlobClient.get_file_length", return_value=100)
@mock.patch("handlers.iq.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_with_cf32_le(
    mock_decrypt, mock_get_file_length, mock_get_blob_properties, client
):
    """Get IQ data with cf32_le. Returns populated float of float array."""
    client.app.dependency_overrides[datasource_repo.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.float32).tobytes()
    format = "cf32_le"
    with mock.patch(
        "blob.azure_client.AzureBlobClient.get_blob_content", return_value=arr
    ):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format={format}&block_size=1&block_indexes_str=1&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == arr


@mock.patch(
    "handlers.iq.AzureBlobClient.get_blob_properties", return_value=test_blob_properties
)
@mock.patch("handlers.iq.AzureBlobClient.get_file_length", return_value=100)
@mock.patch("handlers.iq.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_with_cf32(
    mock_decrypt, mock_get_file_length, mock_get_blob_properties, client
):
    """Get IQ data with cf32. Returns populated float of float array."""
    client.app.dependency_overrides[datasource_repo.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.float32).tobytes()
    format = "cf32"
    with mock.patch(
        "blob.azure_client.AzureBlobClient.get_blob_content", return_value=arr
    ):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format={format}&block_size=1&block_indexes_str=1&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == arr


@mock.patch(
    "handlers.iq.AzureBlobClient.get_blob_properties", return_value=test_blob_properties
)
@mock.patch("handlers.iq.AzureBlobClient.get_file_length", return_value=100)
@mock.patch("handlers.iq.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_with_cf32_be(
    mock_decrypt, mock_get_file_length, mock_get_blob_properties, client
):
    """Get IQ data with cf32_be. Returns populated float of float array."""
    client.app.dependency_overrides[datasource_repo.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.float32).tobytes()
    format = "cf32_be"
    with mock.patch(
        "blob.azure_client.AzureBlobClient.get_blob_content", return_value=arr
    ):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format={format}&block_size=1&block_indexes_str=1&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == arr


@mock.patch(
    "handlers.iq.AzureBlobClient.get_blob_properties", return_value=test_blob_properties
)
@mock.patch("handlers.iq.AzureBlobClient.get_file_length", return_value=100)
@mock.patch("handlers.iq.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_with_ci8(
    mock_decrypt, mock_get_file_length, mock_get_blob_properties, client
):
    """Get IQ data with ci8. Returns populated float of float array."""
    mock_client = AsyncMock()
    mock_client.get_blob_properties.return_value = test_blob_properties
    client.app.dependency_overrides[datasource_repo.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.int8).tobytes()
    format = "ci8"
    with mock.patch(
        "blob.azure_client.AzureBlobClient.get_blob_content", return_value=arr
    ):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format={format}&block_size=1&block_indexes_str=1&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == arr


@mock.patch(
    "handlers.iq.AzureBlobClient.get_blob_properties", return_value=test_blob_properties
)
@mock.patch("handlers.iq.AzureBlobClient.get_file_length", return_value=100)
@mock.patch("handlers.iq.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_with_i8(
    mock_decrypt, mock_get_file_length, mock_get_blob_properties, client
):
    """Get IQ data with i8. Returns populated float of float array."""
    client.app.dependency_overrides[datasource_repo.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.int8).tobytes()
    format = "i8"
    with mock.patch(
        "blob.azure_client.AzureBlobClient.get_blob_content", return_value=arr
    ):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format={format}&block_size=1&block_indexes_str=1&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == arr


@mock.patch(
    "handlers.iq.AzureBlobClient.get_blob_properties", return_value=test_blob_properties
)
@mock.patch("handlers.iq.AzureBlobClient.get_file_length", return_value=100)
@mock.patch("handlers.iq.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_with_multiple_arr_elements_returns_data(
    mock_decrypt, mock_get_file_length, mock_get_blob_properties, client
):
    """Get IQ data with i8. Returns populated float of float array."""
    client.app.dependency_overrides[datasource_repo.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.int8).tobytes()
    input_arr_str = "1,3"
    with mock.patch(
        "blob.azure_client.AzureBlobClient.get_blob_content", return_value=arr
    ):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format=i8&block_size=1&block_indexes_str={input_arr_str}&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == arr + arr


@mock.patch(
    "handlers.iq.AzureBlobClient.get_blob_properties", return_value=test_blob_properties
)
@mock.patch("handlers.iq.AzureBlobClient.get_file_length", return_value=2)
@mock.patch("handlers.iq.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_with_offset_larger_than_blob_size(
    mock_decrypt, mock_get_file_length, mock_get_blob_properties, client
):
    """Get IQ data with offset larger than blob size. Returns partially populated float of float array."""
    client.app.dependency_overrides[datasource_repo.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.int8).tobytes()
    input_arr_str = "2"
    with mock.patch(
        "blob.azure_client.AzureBlobClient.get_blob_content", return_value=arr
    ):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format=i8&block_size=1&block_indexes_str={input_arr_str}&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == b""


@mock.patch(
    "handlers.iq.AzureBlobClient.get_blob_properties", return_value=test_blob_properties
)
@mock.patch("handlers.iq.AzureBlobClient.get_file_length", return_value=3)
@mock.patch("handlers.iq.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_get_iq_data_with_offset_plus_count_larger_than_blob_size(
    mock_decrypt, mock_get_file_length, mock_get_blob_properties, client
):
    """Get IQ data with offset plus count larger than blob size. Returns empty float of float array."""
    client.app.dependency_overrides[datasource_repo.get] = mock_get_test_datasource
    arr = numpy.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=numpy.int8).tobytes()

    input_arr_str = "1"
    with mock.patch(
        "blob.azure_client.AzureBlobClient.get_blob_content", return_value=arr
    ):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format=i8&block_size=1&block_indexes_str={input_arr_str}&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == arr
