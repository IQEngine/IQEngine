import os
import pytest
import asyncio
from httpx import AsyncClient
from main import app

from database.models import Metadata
from tests.test_data import test_datasource, valid_metadata


@pytest.fixture(params=["asyncio"])
def anyio_backend(request):
    return request.param

@pytest.mark.anyio
async def test_api_returns_ok():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/status")
        assert response.status_code == 200
        assert response.json() == "OK"
