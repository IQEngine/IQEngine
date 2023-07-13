import os
from unittest.mock import AsyncMock, Mock, patch

import pytest
from importer.all import import_all_from_env


@pytest.mark.asyncio
async def test_import_plugins_from_env():
    os.environ[
        "IQENGINE_PLUGINS"
    ] = '[{"name": "test_plugin", "url": "http://test_plugin"}]'
    # Mock plugins_collection from database.database
    # from database.database import plugins_collection
    os.environ["IQENGINE_FEATURE_FLAGS"] = '{"test": true}'

    with patch("importer.plugins.plugin_repo.collection") as mockCollectionCall:
        mock_collection = Mock()
        mock_collection.find_one = AsyncMock()
        mock_collection.insert_one = AsyncMock()
        mock_collection.find_one.return_value = None
        mockCollectionCall.return_value = mock_collection
        await import_all_from_env()
        mock_collection.insert_one.assert_called_once()
        mock_collection.find_one.assert_called_once()


@pytest.mark.asyncio
async def test_import_feature_flags_from_env():
    os.environ[
        "IQENGINE_PLUGINS"
    ] = '[{"name": "test_plugin", "url": "http://test_plugin"}]'
    # Mock plugins_collection from database.database
    # from database.database import plugins_collection
    os.environ["IQENGINE_FEATURE_FLAGS"] = '{"test": true}'

    with patch("importer.config.collection") as mockCollectionCall:
        mock_collection = Mock()
        mock_collection.insert_one.return_value = None
        mockCollectionCall.return_value = mock_collection
        await import_all_from_env()
        mock_collection.insert_one.assert_called_once()


@pytest.mark.asyncio
async def test_import_all_from_env_with_broken_plugin(client):
    os.environ[
        "IQENGINE_PLUGINS"
    ] = '["name": "test_plugin", "url": "http://test_plugin"}]'
    # Mock plugins_collection from database.database
    # from database.database import plugins_collection

    with patch("importer.plugins.plugin_repo.collection") as mockCollectionCall:
        mock_collection = Mock()
        mock_collection.find_one = AsyncMock()
        mock_collection.find_one.return_value = None
        mock_collection.insert_one = AsyncMock()
        mock_collection.insert_one.return_value = None
        mockCollectionCall.return_value = mock_collection
        try:
            await import_all_from_env()
        except Exception as e:
            e.args[
                0
            ] == "Failed to load plugins from environment variable IQENGINE_PLUGINS"


@pytest.mark.asyncio
async def test_import_feature_flags_from_env_update():
    os.environ[
        "IQENGINE_PLUGINS"
    ] = '[{"name": "test_plugin", "url": "http://test_plugin"}]'
    # Mock plugins_collection from database.database
    # from database.database import plugins_collection
    os.environ["IQENGINE_FEATURE_FLAGS"] = '{"test": true}'

    with patch("importer.config.collection") as mockCollectionCall:
        with patch("importer.config.get") as mockGetCall:
            mock_collection = Mock()
            mock_collection.update_one.return_value = None
            mockCollectionCall.return_value = mock_collection
            mock_get_config = Mock()
            mock_get_config.feature_flags = None
            mockGetCall.return_value = mock_get_config
            await import_all_from_env()
            mock_collection.update_one.assert_called_once()


@pytest.mark.asyncio
async def test_import_feature_flags_from_env_no_insert_or_update():
    os.environ[
        "IQENGINE_PLUGINS"
    ] = '[{"name": "test_plugin", "url": "http://test_plugin"}]'
    # Mock plugins_collection from database.database
    # from database.database import plugins_collection
    os.environ["IQENGINE_FEATURE_FLAGS"] = '{"test": true}'

    with patch("importer.config.collection") as mockCollectionCall:
        with patch("importer.config.get") as mockGetCall:
            mock_collection = Mock()
            mock_collection.update_one.return_value = None
            mockCollectionCall.return_value = mock_collection
            mock_get_config = Mock()
            mock_get_config.feature_flags = {"test": True}
            mockGetCall.return_value = mock_get_config
            await import_all_from_env()
            mock_collection.insert_one.assert_not_called()
            mock_collection.update_one.assert_not_called()
