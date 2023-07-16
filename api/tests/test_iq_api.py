import base64
from unittest import mock
from unittest.mock import Mock

import pytest
from azure.storage.blob import BlobProperties
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
