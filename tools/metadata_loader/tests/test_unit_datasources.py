from argparse import Namespace
from unittest import TestCase
from unittest.mock import patch
import sys
sys.path.insert(0, '../metadata_loader')
from metadata_loader.main import create_datasource, get_datasources # noqa E402


def mock_request_get(*args, **kwargs):

    class MockResponse:
        def __init__(self, text):
            self.text = text

        def text(self):
            return self.text

    return MockResponse("[{'_id':'2342342342'}]")


def mock_request_post(*args, **kwargs):

    class MockResponse:
        def __init__(self, text):
            self.text = text

        def text(self):
            return self.text

    return MockResponse("added")


mock_config = {
    "API_URL_BASE": "https://some.where.io",
    "STORAGE_ACCOUNT_URL": "https://acct.blob.core.windows.net",
    "STORAGE_SAS_KEY": "xyzzy"
}


class TestDatasources(TestCase):

    @patch(
        'metadata_loader.main.call_get_datasources_api', side_effect=mock_request_get)
    @patch(
        'metadata_loader.main.get_config', return_value=mock_config)
    def test_get_datasources(self, mockConfig, mockCallGetDatasources):

        mock_args = Namespace()

        self.assertEqual(get_datasources(mock_args), "[{'_id':'2342342342'}]")

    @patch(
        'metadata_loader.main.call_create_datasource_api',
        side_effect=mock_request_post
    )
    @patch(
        'metadata_loader.main.get_config',
        return_value=mock_config
    )
    def test_create_datasource(self, mockConfig, mockCallCreateDatasource):

        x = {
            'name': 'name',
            'accountName': 'account',
            'containerName': 'container',
            'description': 'abc 123'
        }
        args = Namespace(**x)

        self.assertEqual(create_datasource(args), 'added')
