import os
from unittest.mock import Mock, patch

from importer.all import import_all_from_env


def test_import_plugins_from_env():
    os.environ[
        "IQENGINE_PLUGINS"
    ] = '[{"name": "test_plugin", "url": "http://test_plugin"}]'
    # Mock plugins_collection from database.database
    # from database.database import plugins_collection
    os.environ["IQENGINE_FEATURE_FLAGS"] = '{"test": true}'

    with patch("importer.plugins.plugins_collection") as mockCollectionCall:
        mock_collection = Mock()
        mock_collection.find_one.return_value = None
        mock_collection.insert_one.return_value = None
        mockCollectionCall.return_value = mock_collection
        import_all_from_env()
        mock_collection.insert_one.assert_called_once()
        mock_collection.find_one.assert_called_once()


def test_import_feature_flags_from_env():
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
        import_all_from_env()
        mock_collection.insert_one.assert_called_once()


def test_import_all_from_env_with_broken_plugin():
    os.environ[
        "IQENGINE_PLUGINS"
    ] = '["name": "test_plugin", "url": "http://test_plugin"}]'
    # Mock plugins_collection from database.database
    # from database.database import plugins_collection

    with patch("importer.plugins.plugins_collection") as mockCollectionCall:
        mock_collection = Mock()
        mock_collection.find_one.return_value = None
        mock_collection.insert_one.return_value = None
        mockCollectionCall.return_value = mock_collection
        try:
            import_all_from_env()
        except Exception as e:
            e.args[
                0
            ] == "Failed to load plugins from environment variable IQENGINE_PLUGINS"


def test_import_feature_flags_from_env_update():
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
            import_all_from_env()
            mock_collection.update_one.assert_called_once()


def test_import_feature_flags_from_env_no_insert_or_update():
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
            import_all_from_env()
            mock_collection.insert_one.assert_not_called()
            mock_collection.update_one.assert_not_called()
