# vim: tabstop=4 shiftwidth=4 expandtab

import os

from httpx import AsyncClient

import database.database as db
import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
async def client() -> AsyncClient:
    async_client = AsyncClient(app=app, base_url="http://test")
    yield async_client
    await async_client.aclose()

@pytest.fixture(autouse=True)
def database():
    os.environ["IN_MEMORY_DB"] = "1"
    yield
    # Ensure db is recreated
    # for each test
    db._db = None
