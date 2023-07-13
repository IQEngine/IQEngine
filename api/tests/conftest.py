# vim: tabstop=4 shiftwidth=4 expandtab
import os

import database.database as db
import pytest_asyncio
from fastapi.testclient import TestClient


@pytest_asyncio.fixture(autouse=True, scope="function")
async def env_setup():
    os.environ["IN_MEMORY_DB"] = "1"
    yield
    db._db = None


@pytest_asyncio.fixture(scope="function")
def client():
    from main import app
    app.add_event_handler("shutdown", db.reset_db)
    with TestClient(app) as test_client:
        yield test_client
