import pytest
from unittest.mock import patch
from fastapi import HTTPException
from helpers.authorization import requires

@pytest.mark.asyncio
async def test_requires():
    # Tests the decorator function `requires` which is used to restrict access to certain endpoints
    def mock_get_current_active_user():
        return {"roles": ["role1", "role2"], "is_active": True, "email": "emailaddress"}

    def mock_get_current_active_user_no_roles():
        return {"roles": [], "is_active": False, "email": "emailaddress"}

    @requires("role1")
    async def test_function():
        return "Hello, World!"

    with patch('helpers.authorization.get_current_active_user', new=mock_get_current_active_user):
        result = await test_function()
        assert result == "Hello, World!"

    with patch('helpers.authorization.get_current_active_user', new=mock_get_current_active_user_no_roles):
        with pytest.raises(HTTPException) as e:
            await test_function()
        assert e.value.status_code == 403
        assert e.value.detail == "Not enough privileges"
