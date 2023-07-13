import os
from unittest import mock
from unittest.mock import AsyncMock, Mock

import pytest
from database.models import Configuration
from importer.all import import_all_from_env


@mock.patch("importer.plugins.plugin_repo.collection", return_value=Mock())
@pytest.mark.asyncio
async def test_import_plugins_from_env(mock_collection):
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


@mock.patch("importer.config.collection", return_value=Mock())
@pytest.mark.asyncio
async def test_import_feature_flags_from_env(mock_collection):
    os.environ[
        "IQENGINE_PLUGINS"
    ] = '[{"name": "test_plugin", "url": "http://test_plugin"}]'
    os.environ["IQENGINE_FEATURE_FLAGS"] = '{"test": true}'

    mock_collection.return_value.insert_one = AsyncMock()
    mock_collection.return_value.insert_one.return_value = None

    await import_all_from_env()

    mock_collection.return_value.insert_one.assert_called_once()


@mock.patch("importer.plugins.plugin_repo.collection", return_value=Mock())
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


@mock.patch("importer.config.collection", return_value=Mock())
@mock.patch("importer.config.get")
@pytest.mark.asyncio
async def test_import_feature_flags_from_env_update(mock_get, mock_collection):
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


@mock.patch("importer.config.collection", return_value=Mock())
@mock.patch("importer.config.get")
@pytest.mark.asyncio
async def test_import_feature_flags_from_env_no_insert_or_update(
    mock_get, mock_collection
):
    os.environ[
        "IQENGINE_PLUGINS"
    ] = '[{"name": "test_plugin", "url": "http://test_plugin"}]'
    os.environ["IQENGINE_FEATURE_FLAGS"] = '{"test": true}'

    test_config = Configuration()
    test_config.feature_flags = {"test": True}
    mock_get.return_value = test_config

    mock_collection.return_value.update_one = AsyncMock()
    mock_collection.return_value.insert_one = AsyncMock()

    await import_all_from_env()

    mock_collection.return_value.update_one.assert_not_called()
    mock_collection.return_value.insert_one.assert_not_called()
