import pytest
from unittest.mock import patch, MagicMock
from fastapi import Depends, HTTPException
from helpers.authorization import requires, get_current_active_user

def test_requires():
    # Tests the decorator function `requires` which is used to restrict access to certain endpoints
    def mock_get_current_active_user():
        return {"roles": ["role1", "role2"], "is_active": True, "email": "emailaddress"}


    def mock_get_current_active_user_no_roles():
        return {"roles": [], "is_active": False, "email": "emailaddress"}
    

    @requires("role1")
    def test_function():
        return "Hello, World!"


    with patch('helpers.authorization.get_current_active_user', new=mock_get_current_active_user):
        result = test_function()
        assert result == "Hello, World!"

    with patch('helpers.authorization.get_current_active_user', new=mock_get_current_active_user_no_roles):
        with pytest.raises(HTTPException) as e:
            test_function()
        assert e.value.status_code == 403
        assert e.value.detail == "Not enough privileges"
