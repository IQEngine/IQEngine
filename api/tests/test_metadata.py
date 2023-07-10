import os
from unittest import mock
from unittest.mock import MagicMock, Mock, patch
from fastapi.testclient import TestClient
from database.database import get_datasource


from database.models import DataSource, Metadata
from tests.test_data import test_datasource, valid_metadata

def override_dependency_datasource():
    return DataSource(**test_datasource)

@mock.patch("handlers.metadata.AzureBlobClient.blob_exist", return_value=True)
@mock.patch("handlers.metadata.AzureBlobClient.get_blob_content", return_value=b"<image data>")
@mock.patch("handlers.metadata.database.database.get_metadata", return_value=Metadata(**valid_metadata))
@mock.patch("handlers.metadata.decrypt", return_value="secret")
def test_api_get_thumbnail_with_image(mock_decrypt:Mock, mock_get_metadata: Mock, mock_get_blob_content: Mock, mock_blob_exist: Mock, client):
    client.app.dependency_overrides[get_datasource] = override_dependency_datasource
    response = client.get(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path/thumbnail'
    )
    assert response.status_code == 200
    mock_get_metadata.assert_not_called()
    mock_get_blob_content.assert_called_once()
    mock_blob_exist.assert_called_once()
    mock_decrypt.assert_called_once()


@mock.patch("handlers.metadata.AzureBlobClient.blob_exist", return_value=False)
@mock.patch("handlers.metadata.database.database.get_metadata", return_value=Metadata(**valid_metadata))
@mock.patch("handlers.metadata.AzureBlobClient.get_new_thumbnail", return_value=b"<thumbnail data>")
@mock.patch("handlers.metadata.AzureBlobClient.upload_blob", return_value=None)
@mock.patch("handlers.metadata.decrypt", return_value="secret")
def test_api_get_thumbnail_with_no_image(mock_decrypt:Mock,
                                         mock_upload_blob: Mock, 
                                         mock_get_new_thumbnail: Mock, 
                                         mock_get_metadata: Mock,
                                         mock_blob_exist: Mock, client: TestClient):
    client.app.dependency_overrides[get_datasource] = override_dependency_datasource
    response = client.get(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path/thumbnail'
    )
    assert response.status_code == 200
    mock_get_metadata.assert_called_once()
    mock_get_new_thumbnail.assert_called_once()
    mock_upload_blob.assert_called_once()
    mock_blob_exist.assert_called_once()
    mock_decrypt.assert_called_once()

