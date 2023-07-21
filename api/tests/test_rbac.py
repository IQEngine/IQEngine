import pytest
from unittest.mock import patch
from fastapi import Depends
from helpers.authorization import requires
from main import app


@pytest.mark.asyncio
async def test_requires(client):
    # Tests the decorator function `requires` which is used to restrict access to certain endpoints
    async def mock_get_current_user():
        return {"roles": ["role1", "role2"], "preferred_username": "emailaddress"}

    async def mock_get_current_user_no_roles():
        return {"roles": [], "preferred_username": "emailaddress"}

    @app.get("/test-function", dependencies=[Depends(requires("role1"))])
    async def test_function():
        return "Hello, World!"

    with patch('helpers.authorization.get_current_user', return_value=mock_get_current_user):
        response = client.get("/test-function")
        assert response.status_code == 200
        assert response.text == "Hello, World!"

    with patch('helpers.authorization.get_current_user', return_value=mock_get_current_user_no_roles):
        response = client.get("/test-function")
        assert response.status_code == 403
        assert response.json() == {"detail": "Not enough privileges"}

