import sys
sys.path.insert(0, '../metadata_loader')

from metadata_loader.main import create_datasource, get_datasources, get_config
from argparse import Namespace
import json


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
    
def test_get_datasources(mocker):
    
    config = {"API_URL_BASE": "", "STORAGE_ACCOUNT_URL": "", "STORAGE_CONNECTION_STRING": "", "STORAGE_SAS_KEY": ""}
    mocker.patch('metadata_loader.main.get_config', return_value=config)
    mocker.patch('metadata_loader.main.call_get_datasources_api', side_effect=mock_request_get)

    args = Namespace()
    assert get_datasources(args) == "[{'_id':'2342342342'}]"

def test_create_datasource(mocker):

    config = {"API_URL_BASE": "", "STORAGE_ACCOUNT_URL": "", "STORAGE_CONNECTION_STRING": "", "STORAGE_SAS_KEY": ""}
    mocker.patch('metadata_loader.main.get_config', return_value=config)
    mocker.patch('metadata_loader.main.call_create_datasource_api', side_effect=mock_request_post)

    x = {'name': 'name', 'accountName': 'account', 'containerName': 'container', 'description': 'abc 123'}
    args = Namespace(**x)
    assert create_datasource(args) == 'added'
