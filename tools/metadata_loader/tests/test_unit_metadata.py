import sys
sys.path.insert(0, '../metadata_loader')

from metadata_loader.main import get_all_meta, create_meta, initial_load_meta, BlobServiceClient, ContainerClient, BlobClient
from argparse import Namespace
import json
from unittest.mock import patch, MagicMock
from unittest import TestCase

def mock_request_get(*args, **kwargs):

    class MockResponse:
        def __init__(self, text):
            self.text = text
        def text(self):
            return self.text

    return MockResponse("[]")

def mock_request_post(*args, **kwargs):

    class MockResponse:
        def __init__(self, text):
            self.text = text
        def text(self):
            return self.text

    return MockResponse("added")

def test_get_all_metadata(mocker):
    
    config = {"API_URL_BASE": "", "STORAGE_ACCOUNT_URL": "", "STORAGE_SAS_KEY": ""}
    mocker.patch('metadata_loader.main.get_config', return_value=config)
    mocker.patch('metadata_loader.main.call_get_all_metadata_api', side_effect=mock_request_get)

    x = {'accountName': 'account', 'containerName': 'container'}
    args = Namespace(**x)
    assert get_all_meta(args) == '[]'

def test_create_metadata(mocker):

    config = {"API_URL_BASE": "", "STORAGE_ACCOUNT_URL": "", "STORAGE_SAS_KEY": ""}
    mocker.patch('metadata_loader.main.get_config', return_value=config)
    mocker.patch('metadata_loader.main.call_create_meta_api', side_effect=mock_request_post)

    x = {'accountName': 'account', 'containerName': 'container', 'filepath': '/dir1/dir2/file.sigmf-meta', 'document': '{"abc":"123"}'}
    args = Namespace(**x)
    assert create_meta(args.accountName, args.containerName, args.filepath, args.document) == 'added'


def mock_list_blobs(*args, **kwargs):

    class blob:
        def __init__(self, name):
            self.name = name
        def name(self):
            return self.name

    return [blob("abc"), blob('def')]

class FakeBlobServiceClient:
    def list_blobs():
        return mock_list_blobs

class FakeContainer_Client:
    def get_container_client(container):
        return FakeBlobServiceClient

class TestInitialLoadClass(TestCase):
    
    @patch('metadata_loader.main.BlobServiceClient', return_value = FakeContainer_Client)
    @patch('metadata_loader.main.get_config')
    def test_initial_load(self, mockConfig, mockBlobServiceClient):
        
        config = {"API_URL_BASE": "", "STORAGE_ACCOUNT_URL": "", "STORAGE_SAS_KEY": ""}
        mockConfig.return_value = config

        x = {'accountName': 'account', 'containerName': 'container'}
        args = Namespace(**x)

        ret = initial_load_meta(args)

        self.assertEqual(ret, mock_list_blobs)

