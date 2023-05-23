# vim: tabstop=4 shiftwidth=4 expandtab

import pytest
from pymongo_inmemory import MongoClient
from fastapi.testclient import TestClient

from ..api import create_app
from ..database import create_in_memory_db_client

@pytest.fixture
def client():
    c = TestClient(create_app(create_in_memory_db_client()))
    yield c
