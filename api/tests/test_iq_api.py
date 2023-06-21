from unittest.mock import patch, Mock
from tests.test_data import test_datasource, valid_metadata
import base64


def test_get_iq(client):
    response = client.post("/api/datasources", json=test_datasource).json()
    response = client.post(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path/meta',
        json=valid_metadata,)

    # Mock the BlobClient and its methods
    with patch('handlers.iq.BlobClient') as MockBlobClient:
        testBytes = b'the quick brown fox jumps over the lazy dog'
        mock_blob = Mock()
        mock_blob.readall.return_value = testBytes
        mock_blob_client = Mock()
        mock_blob_client.get_blob_properties.return_value = Mock(size=43)
        mock_blob_client.download_blob = Mock(return_value=mock_blob)
        MockBlobClient.from_blob_url.return_value = mock_blob_client

        response = client.get(
            f'/api/datasources/'
            f'{test_datasource["account"]}/{test_datasource["container"]}'
            f'/file_path/iqslice?offsetBytes=0&countBytes=10')

        assert response.status_code == 200
        assert response.json() == {"data": base64.b64encode(testBytes).decode()}


def test_get_iq_data_slices(client):
    response = client.post("/api/datasources", json=test_datasource).json()
    response = client.post(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path/meta',
        json=valid_metadata,)

    # Mock the BlobClient and its methods
    with patch('handlers.iq.BlobClient') as MockBlobClient:
        mock_blob = Mock()
        mock_blob.readall.return_value = b'the quick brown fox jumps over the lazy dog'
        mock_blob_client = Mock()
        mock_blob_client.get_blob_properties.return_value = Mock(size=43)
        mock_blob_client.download_blob = Mock(return_value=mock_blob)
        MockBlobClient.from_blob_url.return_value = mock_blob_client

        response = client.post(
            f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/filepath/iqslices',
            json={"indexes": [0, 1, 2], "tile_size": 2, "bytes_per_sample": 4}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
