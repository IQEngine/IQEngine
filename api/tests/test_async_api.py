import os
import pytest
import asyncio
from httpx import AsyncClient
from main import app

from database.models import Metadata
from tests.test_data import test_datasource, valid_metadata

async def test_api_returns_ok(client: AsyncClient):
    response = client.get("/api/status")
    assert response.status_code == 200
    assert response.json() == "OK"
