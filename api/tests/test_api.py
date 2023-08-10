# vim: tabstop=4 shiftwidth=4 expandtab
import os
from unittest import mock
from unittest.mock import Mock

import pytest
from database.models import Configuration, Metadata
from tests.test_data import test_datasource, valid_metadata


@pytest.mark.asyncio
async def test_api_get_config(client):
    os.environ["IQENGINE_CONNECTION_INFO"] = "{}"
    os.environ["IQENGINE_GOOGLE_ANALYTICS_KEY"] = "google_analytics_key"
    os.environ["IQENGINE_INTERNAL_BRANDING"] = "internal_branding_string"
    os.environ["IQENGINE_APP_ID"] = "app_id"
    os.environ["IQENGINE_APP_AUTHORITY"] = "app_authority"

    test_get_config = Configuration()

    with mock.patch("handlers.config.get", return_value=test_get_config):
        response = client.get("/api/config")
        assert response.status_code == 200
        assert response.json() == {
            "connectionInfo": {},
            "googleAnalyticsKey": "google_analytics_key",
            "featureFlags": None,
            "internalBranding": "internal_branding_string",
            "appId": "app_id",
            "appAuthority": "app_authority",
            "uploadPageBlobSasUrl": None,
        }


@pytest.mark.asyncio
async def test_api_get_config_feature_flags(client):
    os.environ["IQENGINE_CONNECTION_INFO"] = "{}"
    os.environ["IQENGINE_GOOGLE_ANALYTICS_KEY"] = "google_analytics_key"
    os.environ["IQENGINE_INTERNAL_BRANDING"] = "internal_branding_string"
    os.environ["IQENGINE_APP_ID"] = "app_id"
    os.environ["IQENGINE_APP_AUTHORITY"] = "app_authority"

    test_get_config = Configuration()
    test_get_config.feature_flags = {"test": True}

    with mock.patch("handlers.config.get", return_value=test_get_config):
        response = client.get("/api/config")
        assert response.status_code == 200
        assert response.json() == {
            "connectionInfo": {},
            "googleAnalyticsKey": "google_analytics_key",
            "featureFlags": {"test": True},
            "internalBranding": "internal_branding_string",
            "appId": "app_id",
            "appAuthority": "app_authority",
            "uploadPageBlobSasUrl": None,
        }


# This test no longer valid as URL will never be valid with made up account and container
@pytest.mark.asyncio
async def test_api_post_meta_bad_datasource_id(client):
    response = client.post(
        "/api/datasources/nota/validid/file_path/meta", json=valid_metadata
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "Datasource not found"}


@pytest.mark.asyncio
async def test_api_post_meta_missing_datasource(client):
    source_id = "madeup/datasource"
    response = client.post(
        f"/api/datasources/{source_id}/file_path/meta", json=valid_metadata
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "Datasource not found"}


@pytest.mark.asyncio
async def test_api_post_meta(client):
    client.post("/api/datasources", json=test_datasource).json()
    response = client.post(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path/meta',
        json=valid_metadata,
    )
    assert response.status_code == 201
    metadata = Metadata.parse_obj(response.json())
    assert metadata.globalMetadata.traceability_revision == 0
    assert metadata.globalMetadata.traceability_origin == {
        "type": "api",
        "account": test_datasource["account"],
        "container": test_datasource["container"],
        "file_path": "file_path",
    }
    assert (
        metadata.annotations[0].core_sample_start
        == valid_metadata["annotations"][0]["core:sample_start"]
    )
    assert (
        metadata.annotations[0].core_sample_count
        == valid_metadata["annotations"][0]["core:sample_count"]
    )
    assert (
        metadata.captures[0].core_sample_start
        == valid_metadata["captures"][0]["core:sample_start"]
    )


@pytest.mark.asyncio
async def test_api_post_existing_meta(client):
    client.post("/api/datasources", json=test_datasource).json()
    response = client.post(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path/meta',
        json=valid_metadata,
    )
    response = client.post(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path/meta',
        json=valid_metadata,
    )
    assert response.status_code == 409
    assert response.json() == {"detail": "Metadata already exists"}


@pytest.mark.asyncio
async def test_api_put_meta(client):
    client.post("/api/datasources", json=test_datasource).json()
    response = client.post(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path/meta',
        json=valid_metadata,
    )
    assert response.status_code == 201
    response = client.put(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path/meta',
        json=valid_metadata,
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_api_put_meta_not_existing(client):
    client.post("/api/datasources", json=test_datasource).json()
    response = client.put(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path/meta',
        json=valid_metadata,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_api_get_meta(client):
    client.post("/api/datasources", json=test_datasource).json()
    response = client.post(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path/meta',
        json=valid_metadata,
    )
    response = client.get(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path/meta'
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_api_get_track_meta(client):
    client.post("/api/datasources", json=test_datasource).json()
    response = client.post(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path/meta',
        json=valid_metadata,
    )
    response = client.get(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path/track'
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_api_get_missing_track_meta(client):
    response = client.get(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path/track'
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_api_get_meta_not_existing(client):
    response = client.get(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path/meta'
    )
    assert response.status_code == 404  # Because the datasource doesn't exist
    client.post("/api/datasources", json=test_datasource).json()
    response = client.get(
        '/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path/meta'
    )
    assert response.status_code == 404  # Because the metadata doesn't exist


@pytest.mark.asyncio
async def test_api_get_all_meta(client):
    client.post("/api/datasources", json=test_datasource).json()
    client.post(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/record_a/meta',
        json=valid_metadata,
    )
    client.post(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/record_b/meta',
        json=valid_metadata,
    )
    response = client.get(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/meta'
    )
    assert response.status_code == 200
    assert len(response.json()) == 2


@pytest.mark.asyncio
async def test_api_get_all_meta_path(client):
    client.post("/api/datasources", json=test_datasource).json()
    client.post(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/record_a/meta',
        json=valid_metadata,
    )
    client.post(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/record_b/meta',
        json=valid_metadata,
    )
    response = client.get(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/meta/paths'
    )
    assert response.status_code == 200
    assert "record_a" in response.json()
    assert "record_b" in response.json()


@pytest.mark.asyncio
async def test_api_create_datasource(client):
    response = client.post("/api/datasources", json=test_datasource)
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_api_put_datasource(client):
    local_test_datasource = test_datasource.copy()
    response = client.post("/api/datasources", json=local_test_datasource)
    local_test_datasource["description"] = "new description"
    local_test_datasource["sasToken"] = "new sasToken"
    response = client.put(
        f'/api/datasources/{local_test_datasource["account"]}'
        f'/{local_test_datasource["container"]}/datasource',
        json=local_test_datasource,
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_api_get_datasources(client):
    response = client.get("/api/datasources")
    assert response.status_code == 200
    assert len(response.json()) == 0

    response = client.post("/api/datasources", json=test_datasource)
    response = client.get("/api/datasources")
    assert response.status_code == 200
    assert len(response.json()) == 1


@pytest.mark.asyncio
async def test_api_get_datasource(client):
    response = client.post("/api/datasources", json=test_datasource)
    response = client.get(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/datasource'
    )
    assert response.status_code == 200
    assert len(response.json()) > 1


@pytest.mark.asyncio
async def test_api_filename_url_encoded(client):
    client.post("/api/datasources", json=test_datasource).json()
    response = client.post(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file%2Fpath/meta',
        json=valid_metadata,
    )
    assert response.status_code == 201
    response = client.get(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file%2Fpath/meta'
    )
    assert response.status_code == 200
    response_object = response.json()
    assert (
        response_object["global"]["traceability:origin"]["account"]
        == test_datasource["account"]
    )
    assert (
        response_object["global"]["traceability:origin"]["container"]
        == test_datasource["container"]
    )
    assert response_object["global"]["traceability:origin"]["file_path"] == "file/path"


@pytest.mark.asyncio
async def test_api_filename_non_url_encoded(client):
    client.post("/api/datasources", json=test_datasource).json()
    response = client.post(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file/path/meta',
        json=valid_metadata,
    )
    assert response.status_code == 201
    response = client.get(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file/path/meta'
    )
    assert response.status_code == 200
    response_object = response.json()
    assert (
        response_object["global"]["traceability:origin"]["account"]
        == test_datasource["account"]
    )
    assert (
        response_object["global"]["traceability:origin"]["container"]
        == test_datasource["container"]
    )
    assert response_object["global"]["traceability:origin"]["file_path"] == "file/path"
    assert response_object["global"]["traceability:revision"] == 0


@pytest.mark.asyncio
async def test_api_update_file_version(client):
    client.post("/api/datasources", json=test_datasource).json()
    response = client.post(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file/path/meta',
        json=valid_metadata,
    )
    assert response.status_code == 201
    new_metadata = valid_metadata
    new_metadata["annotations"][0]["core:sample_start"] = 10000
    response = client.put(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file/path/meta',
        json=new_metadata,
    )
    assert response.status_code == 204
    response = client.get(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file/path/meta'
    )
    assert response.status_code == 200
    response_object = response.json()
    assert response_object["global"]["traceability:revision"] == 1
    assert (
        response_object["global"]["traceability:origin"]["account"]
        == test_datasource["account"]
    )
    assert (
        response_object["global"]["traceability:origin"]["container"]
        == test_datasource["container"]
    )
    assert response_object["global"]["traceability:origin"]["file_path"] == "file/path"
    assert response_object["annotations"][0]["core:sample_start"] == 10000


@mock.patch("graph.graph_client.requests.get", return_value=Mock())
@mock.patch(
    "graph.graph_client.msal.ConfidentialClientApplication", return_value=Mock()
)
@pytest.mark.asyncio
async def test_api_get_users_successful_acquire_token_silent(
    mock_confidential_client, mock_get, client
):
    mock_confidential_client.return_value.acquire_token_silent.return_value = {
        "access_token": "123"
    }

    content = {
        "value": [
            {
                "id": "123",
                "displayName": "test",
            },
            {
                "id": "456",
                "displayName": "test2",
            },
        ]
    }

    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = content

    response = client.get("/api/users")
    assert response.status_code == 200
    assert len(response.json()) == 2
    assert response.json()[0]["id"] == "123"
    assert response.json()[0]["displayName"] == "test"
    assert response.json()[1]["id"] == "456"
    assert response.json()[1]["displayName"] == "test2"


@mock.patch("graph.graph_client.requests.get", return_value=Mock())
@mock.patch(
    "graph.graph_client.msal.ConfidentialClientApplication", return_value=Mock()
)
@pytest.mark.asyncio
async def test_api_get_users_successful_acquire_token_for_client(
    mock_confidential_client, mock_get, client
):
    mock_confidential_client.return_value.acquire_token_silent.return_value = None
    mock_confidential_client.return_value.acquire_token_for_client.return_value = {
        "access_token": "123"
    }

    content = {
        "value": [
            {
                "id": "123",
                "displayName": "test",
            },
            {
                "id": "456",
                "displayName": "test2",
            },
        ]
    }

    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = content

    response = client.get("/api/users")
    assert response.status_code == 200
    assert len(response.json()) == 2
    assert response.json()[0]["id"] == "123"
    assert response.json()[0]["displayName"] == "test"
    assert response.json()[1]["id"] == "456"
    assert response.json()[1]["displayName"] == "test2"
