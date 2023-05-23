# vim: tabstop=4 shiftwidth=4 expandtab

import pytest
from fastapi.testclient import TestClient

from main import app

@pytest.fixture
def client():
    yield TestClient(app)
