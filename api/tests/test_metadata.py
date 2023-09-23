from unittest import mock
from unittest.mock import Mock

import pytest
from app import datasource_repo
from app.models import DataSource, Metadata
from tests.test_data import test_datasource, valid_metadata


def override_dependency_datasource_repo_get():
    return DataSource(**test_datasource)


@mock.patch("app.metadata_router.AzureBlobClient.blob_exist", return_value=True)
@mock.patch(
    "app.metadata_router.AzureBlobClient.get_blob_content", return_value=b"<image data>"
)
@mock.patch(
    "app.metadata_router.metadata_repo.get",
    return_value=Metadata(**valid_metadata),
)
@mock.patch("app.metadata_router.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_api_get_thumbnail_with_image(
    mock_decrypt: Mock,
    mock_get_metadata: Mock,
    mock_get_blob_content: Mock,
    mock_blob_exist: Mock,
    client,
):
    client.app.dependency_overrides[
        datasource_repo.get
    ] = override_dependency_datasource_repo_get

    response = client.get(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path.jpg'
    )
    assert response.status_code == 200
    mock_get_metadata.assert_not_called()
    mock_get_blob_content.assert_called_once()
    mock_blob_exist.assert_called_once()
    mock_decrypt.mock_calls == 2


@mock.patch("app.metadata_router.AzureBlobClient.blob_exist", return_value=False)
@mock.patch(
    "app.metadata_router.metadata_repo.get",
    return_value=Metadata(**valid_metadata),
)
@mock.patch(
    "app.metadata_router.AzureBlobClient.get_new_thumbnail",
    return_value=b"<thumbnail data>",
)
@mock.patch("app.metadata_router.AzureBlobClient.upload_blob", return_value=None)
@mock.patch("app.metadata_router.decrypt", return_value="secret")
@pytest.mark.asyncio
async def test_api_get_thumbnail_with_no_image(
    mock_decrypt: Mock,
    mock_upload_blob: Mock,
    mock_get_new_thumbnail: Mock,
    mock_get_metadata: Mock,
    mock_blob_exist: Mock,
    client,
):
    client.app.dependency_overrides[
        datasource_repo.get
    ] = override_dependency_datasource_repo_get
    response = client.get(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path.jpg'
    )
    assert response.status_code == 200
    mock_get_metadata.assert_called_once()
    mock_get_new_thumbnail.assert_called_once()
    mock_upload_blob.assert_called_once()
    mock_blob_exist.assert_called_once()
    mock_decrypt.mock_calls == 2
