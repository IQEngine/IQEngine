import os
import pytest
import asyncio
from httpx import AsyncClient
from main import app

from database.models import Metadata
from tests.test_data import test_datasource, valid_metadata
from motor.core import AgnosticClient
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)
AgnosticClient.get_io_loop = asyncio.get_event_loop


@pytest.fixture(params=["asyncio"])
def anyio_backend(request):
    return request.param

@pytest.mark.anyio
async def test_api_returns_ok():
    async with AsyncClient(app=app, base_url="http://test",loop=asyncio.new_event_loop()) as client:
        response = await client.get("/api/status")
        assert response.status_code == 200
        assert response.json() == "OK"
