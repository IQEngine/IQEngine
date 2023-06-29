import os
from unittest.mock import Mock, patch

from importer.all import import_all_from_env


def test_import_all_from_env(client):
    os.environ[
        "IQENGINE_PLUGINS"
    ] = '[{"name": "test_plugin", "url": "http://test_plugin"}]'
    # Mock plugins_collection from database.database
    # from database.database import plugins_collection

    with patch("importer.plugins.plugins_collection") as mockCollectionCall:
        mock_collection = Mock()
        mock_collection.find_one.return_value = None
        mock_collection.insert_one.return_value = None
        mockCollectionCall.return_value = mock_collection
        import_all_from_env()
        mock_collection.insert_one.assert_called_once()
        mock_collection.find_one.assert_called_once()


def test_import_all_from_env_with_broken_plugin(client):
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
