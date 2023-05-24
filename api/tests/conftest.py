# vim: tabstop=4 shiftwidth=4 expandtab

import pytest
import database.database as db
from fastapi.testclient import TestClient

from main import app

app.dependency_overrides[db.db] = db.db_inmem

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture(autouse = True)
def database():
    yield 
    # Ensure db is recreated 
    # for each test
    db._db = None
