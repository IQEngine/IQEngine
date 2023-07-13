# vim: tabstop=4 shiftwidth=4 expandtab
import os

import database.database as db
import pytest_asyncio
from fastapi.testclient import TestClient


@pytest_asyncio.fixture(autouse=True)
def env_setup():
    os.environ["IN_MEMORY_DB"] = "1"
    yield
    db._db = None


@pytest_asyncio.fixture()
def client():
    from main import app

    with TestClient(app) as test_client:
        yield test_client
