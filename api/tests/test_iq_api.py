import base64
import json
from unittest import mock
from unittest.mock import Mock
import numpy

import pytest
from azure.storage.blob import BlobProperties
from fastapi.testclient import TestClient
from database.models import DataSource
from database import datasource_repo
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
        json={"indexes": [0, 1, 2], "tile_size": 2, "bytes_per_sample": 4},
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert mock_get_blob_content.call_count == 3
    assert mock_get_blob_content.call_args_list[0][1]["offset"] == 0
    assert mock_get_blob_content.call_args_list[0][1]["length"] == 16
    assert mock_get_blob_content.call_args_list[1][1]["offset"] == 16
    assert mock_get_blob_content.call_args_list[1][1]["length"] == 16
    assert mock_get_blob_content.call_args_list[2][1]["offset"] == 32
    assert mock_get_blob_content.call_args_list[2][1]["length"] == 16
    assert mock_set_sas_token.call_count == 1
    assert mock_get_blob_properties.call_count == 1

@pytest.mark.asyncio
async def test_get_iq_data_invalid_format(client):
    """ Get IQ data with invalid format. Returns 400. """

    
    pass

async def mock_get_test_datasource():
    return DataSource(**test_datasource)

@mock.patch("handlers.iq.AzureBlobClient.set_sas_token", return_value=None)
@mock.patch(
    "handlers.iq.AzureBlobClient.get_blob_properties", return_value=test_blob_properties
)
@pytest.mark.asyncio
async def test_get_iq_data_with_ci16_le(mock_get_blob_properties, mock_set_sas_token, client):
    """ Get IQ data with iq16_le. Returns populated float of float array. """
    client.app.dependency_overrides[datasource_repo.get] = mock_get_test_datasource
    arr = numpy.array([1,2,3,4,5,6,7,8], dtype=numpy.int16) 
    res = arr.tobytes()
    with mock.patch("blob.azure_client.AzureBlobClient.get_blob_content", return_value=res):
        response = client.get(
            f"/api/datasources/"
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f"/file_path/iq-data?format=ci16_le&fft_start=1&fft_size=1&fft_step=1&num_ffts=1&filepath=test"
        )
        assert response.status_code == 200
        assert response.content == res

@pytest.mark.asyncio
async def test_get_iq_data_with_iq16():
    """ Get IQ data with iq16. Returns populated float of float array. """
    pass

@pytest.mark.asyncio
async def test_get_iq_data_with_cf32_le():
    """ Get IQ data with cf32_le. Returns populated float of float array. """
    pass

@pytest.mark.asyncio
async def test_get_iq_data_with_ci8():
    """ Get IQ data with ci8. Returns populated float of float array. """
    pass

@pytest.mark.asyncio
async def test_get_iq_data_with_i8():
    """ Get IQ data with i8. Returns populated float of float array. """
    pass

@pytest.mark.asyncio
async def test_get_iq_data_valid_input():
    """ Get IQ data with valid input. Returns populated float of float array. """
    pass

@pytest.mark.asyncio
async def test_get_iq_data_with_offset_larger_than_blob_size():
    """ Get IQ data with offset larger than blob size. Returns partially populated float of float array. """
    pass

@pytest.mark.asyncio
async def test_get_iq_data_with_offset_plus_count_larger_than_blob_size():
    """ Get IQ data with offset plus count larger than blob size. Returns empty float of float array. """
    pass
