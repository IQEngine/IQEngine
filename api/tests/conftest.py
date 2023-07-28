# vim: tabstop=4 shiftwidth=4 expandtab
import os
from typing import List, Optional, Union
from unittest import mock

import database.database as db
import pytest
import pytest_asyncio
from fastapi.testclient import TestClient


@pytest_asyncio.fixture(autouse=True, scope="function")
async def env_setup():
    os.environ["IN_MEMORY_DB"] = "1"
    yield
    db._db = None


@pytest.mark.asyncio
def required_roles_mock(role: Optional[Union[str, List[str]]] = None):
    async def wrapper():
        return {
            "roles": ["IQEngine-Admin", "IQEngine-User"],
            "preferred_username": "emailaddress",
        }

    return wrapper


@pytest_asyncio.fixture(scope="function")
def client():
    os.environ["IQENGINE_PLUGINS"] = "[]"
    os.environ["IQENGINE_CONNECTION_INFO"] = '{"settings": []}'
    with mock.patch("importer.all.import_all_from_env") as mock_i, mock.patch(
        "helpers.authorization.required_roles", return_value=required_roles_mock()
    ):
        mock_i.return_value = None
        from main import app

        app.add_event_handler("shutdown", db.reset_db)
        with TestClient(app) as test_client:
            yield test_client
