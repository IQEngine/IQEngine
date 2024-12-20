# vim: tabstop=4 shiftwidth=4 expandtab
import os
from typing import List, Optional, Union
from unittest import mock

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient


@pytest_asyncio.fixture(autouse=True, scope="function")
async def env_setup():
    os.environ["IN_MEMORY_DB"] = "1"
    yield
    import app.database as db

    db._db = None


@pytest.mark.asyncio
def required_roles_mock(role: Optional[Union[str, List[str]]] = None):
    async def wrapper():
        return {
            "roles": ["IQEngine-Admin", "IQEngine-User"],
            "preferred_username": "emailaddress",
        }

    return wrapper


@pytest.mark.asyncio
def check_access_mock(account: str, container: str, user=None):
    async def wrapper(account: str, container: str, user=None):
        return "owner"

    return wrapper


def get_current_user_mock():
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
    with mock.patch(
        "helpers.datasource_access.check_access",
        new=check_access_mock("account", "container", None),
    ):
        with mock.patch(
            "helpers.authorization.get_current_user",
            new=get_current_user_mock(),
        ):
            with mock.patch(
                "app.datasources_router.get_current_user",
                new=get_current_user_mock(),
            ):
                with mock.patch("helpers.import_env.import_all_from_env") as mock_i:
                    mock_i.return_value = None
                    import app.database as db
                    from main import app

                    app.add_event_handler("shutdown", db.reset_db)
                    with TestClient(app) as test_client:
                        yield test_client
