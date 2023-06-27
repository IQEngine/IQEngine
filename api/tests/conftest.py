# vim: tabstop=4 shiftwidth=4 expandtab

import os

import database.database as db
import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def database():
    os.environ["IN_MEMORY_DB"] = "1"
    yield
    # Ensure db is recreated
    # for each test
    db._db = None
