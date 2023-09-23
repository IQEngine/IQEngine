import os
from unittest import mock
from unittest.mock import AsyncMock, Mock

import pytest
from app.models import Configuration
from app.all import import_all_from_env


@mock.patch("app.plugins.collection", return_value=Mock())
@mock.patch("app.config_repo.import_default_config_from_env", return_value=None)
@mock.patch("app.datasource_repo.import_datasources_from_env", return_value=None)
@pytest.mark.asyncio
async def test_import_plugins_from_env(mock_datasources, mock_plugins, mock_collection):
    os.environ[
        "IQENGINE_PLUGINS"
    ] = '[{"name": "test_plugin", "url": "http://test_plugin"}]'
    os.environ["IQENGINE_FEATURE_FLAGS"] = '{"test": true}'

    mock_collection.return_value.find_one = AsyncMock()
    mock_collection.return_value.find_one.return_value = None
    mock_collection.return_value.insert_one = AsyncMock()

    await import_all_from_env()

    mock_collection.return_value.insert_one.assert_called_once()
    mock_collection.return_value.find_one.assert_called_once()
    mock.patch.stopall()


@mock.patch("app.config_repo.collection", return_value=Mock())
@mock.patch("app.config_repo.get", return_value=None)
@mock.patch("app.plugins.import_plugins_from_env", return_value=None)
@mock.patch("app.datasource_repo.import_datasources_from_env", return_value=None)
@pytest.mark.asyncio
async def test_import_feature_flags_from_env(
    mock_datasources, mock_plugins, mock_get, mock_collection
):
    os.environ["IQENGINE_FEATURE_FLAGS"] = '{"test": true}'

    mock_collection.return_value.insert_one = AsyncMock()
    mock_collection.return_value.insert_one.return_value = None

    await import_all_from_env()

    mock_collection.return_value.insert_one.assert_called_once()


@mock.patch("app.plugins.collection", return_value=Mock())
@pytest.mark.asyncio
async def test_import_all_from_env_with_broken_plugin(mock_collection):
    os.environ[
        "IQENGINE_PLUGINS"
    ] = '["name": "test_plugin", "url": "http://test_plugin"}]'

    mock_collection.return_value.find_one = AsyncMock()
    mock_collection.return_value.find_one.return_value = None
    mock_collection.return_value.insert_one = AsyncMock()
    mock_collection.return_value.insert_one.return_value = None

    try:
        await import_all_from_env()
    except Exception as e:
        e.args[0] == "Failed to load plugins from environment variable IQENGINE_PLUGINS"


@mock.patch("app.config_repo.collection", return_value=Mock())
@mock.patch("app.config_repo.get")
@mock.patch("app.plugins.import_plugins_from_env", return_value=None)
@mock.patch("app.datasource_repo.import_datasources_from_env", return_value=None)
@pytest.mark.asyncio
async def test_import_feature_flags_from_env_update(
    mock_datasource, mock_plugins, mock_get, mock_collection
):
    os.environ[
        "IQENGINE_PLUGINS"
    ] = '[{"name": "test_plugin", "url": "http://test_plugin"}]'
    os.environ["IQENGINE_FEATURE_FLAGS"] = '{"test": true}'

    test_config = Configuration()
    test_config.feature_flags = None
    mock_get.return_value = test_config

    mock_collection.return_value.update_one = AsyncMock()
    mock_collection.return_value.insert_one = AsyncMock()

    await import_all_from_env()

    mock_collection.return_value.update_one.assert_called_once()
    mock_collection.return_value.insert_one.assert_not_called()


@mock.patch("app.config_repo.collection", return_value=Mock())
@mock.patch("app.config_repo.get")
@mock.patch("app.plugins.import_plugins_from_env", return_value=None)
@mock.patch("app.datasource_repo.import_datasources_from_env", return_value=None)
@pytest.mark.asyncio
async def test_import_feature_flags_from_env_no_insert_or_update(
    mock_datasource, mock_plugins, mock_get, mock_collection
):
    os.environ["IQENGINE_FEATURE_FLAGS"] = '{"test": true}'

    test_config = Configuration()
    test_config.feature_flags = {"test": True}
    mock_get.return_value = test_config

    mock_collection.return_value.update_one = AsyncMock()
    mock_collection.return_value.insert_one = AsyncMock()

    await import_all_from_env()

    mock_collection.return_value.update_one.assert_not_called()
    mock_collection.return_value.insert_one.assert_not_called()


@mock.patch("app.datasource_repo.import_datasources_from_env", return_value=Mock())
@mock.patch("app.plugins.import_plugins_from_env", return_value=None)
@mock.patch("app.config_repo.import_default_config_from_env", return_value=None)
@pytest.mark.asyncio
async def test_import_datasources_from_env(mock_plugins, mock_config, mock_datasource):
    os.environ[
        "IQENGINE_CONNECTION_INFO"
    ] = """
        {
            "settings":
            [
                {
                    "accountName": "test_account",
                    "containerName": "test_container",
                    "sasToken": "test_sas_token",
                    "name": "test_name",
                    "description": "test_description",
                    "imageURL": "test_image_url",
                    "accountKey": "test_account_key"
                }
            ]
        }
    """

    mock_datasource.datasource_exists = AsyncMock()
    mock_datasource.datasource_exists.return_value = False
    mock_datasource.create = AsyncMock()
    mock_datasource.create.return_value = None

    await import_all_from_env()

    mock_datasource.datasource_exists.assert_called_once()
    mock_datasource.create.assert_called_once()
