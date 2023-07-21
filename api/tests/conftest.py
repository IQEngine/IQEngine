# vim: tabstop=4 shiftwidth=4 expandtab
import os
from unittest import mock

import database.database as db
import pytest_asyncio
from fastapi.testclient import TestClient
from typing import Optional, Union, List


@pytest_asyncio.fixture(autouse=True, scope="function")
async def env_setup():
    os.environ["IN_MEMORY_DB"] = "1"
    yield
    db._db = None


def requires_mock(role: Optional[Union[str, List[str]]] = None):
    async def wrapper():
        return {"roles": ["IQEngine-Admin", "IQEngine-User"], "preferred_username": "emailaddress"}
    return wrapper


@pytest_asyncio.fixture(scope="function")
def client():
    os.environ["IQENGINE_PLUGINS"] = "[]"
    with mock.patch("importer.all.import_all_from_env") as mock_i, \
            mock.patch("helpers.authorization.requires", new=requires_mock), \
                mock.patch("helpers.authorization.get_current_user", return_value={"roles": ["IQEngine-Admin", "IQEngine-User"], "preferred_username": "emailaddress"}):
        mock_i.return_value = None
        from main import app

        app.add_event_handler("shutdown", db.reset_db)
        with TestClient(app) as test_client:
            yield test_client
