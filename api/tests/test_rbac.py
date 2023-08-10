import os
import json
import pytest
from unittest.mock import Mock, patch
from fastapi import HTTPException
from helpers.authorization import get_current_user, required_roles


def test_required_roles_with_valid_role():
    current_user = {"roles": ["IQEngine-User"], "preferred_username": "emailaddress"}
    result = required_roles(roles="IQEngine-User", user=current_user)
    assert result["preferred_username"] == "emailaddress"


def test_required_roles_with_invalid_role():
    # Tests the decorator function `required_roles` which is used to restrict access to certain endpoints
    current_user = {"roles": ["IQEngine-User"], "preferred_username": "emailaddress"}
    try:
        _ = required_roles(roles="invalid-role", user=current_user)

    except HTTPException as e:
        assert e.status_code == 403
        assert e.detail == "Not enough privileges"


def test_required_roles_with_no_role():
    # Tests the decorator function `required_roles` which is used to restrict access to certain endpoints
    current_user = {"roles": [], "preferred_username": "emailaddress"}
    try:
        _ = required_roles(roles="IQEngine-User", user=current_user)
    except HTTPException as e:
        assert e.status_code == 403
        assert e.detail == "Not enough privileges"


def load_json_from_file(file_name: str):
    test_directory = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(test_directory, file_name)
    with open(file_path, "r") as file:
        return json.load(file)


json_data = load_json_from_file("test_keys.json")
TEST_PUBLIC_KEY = json_data["TEST_PUBLIC_KEY"]
VALID_TEST_TOKEN = json_data["VALID_TEST_TOKEN"]


@patch(
    "helpers.authorization.jwks_handler.get_jwks"
)
def test_get_current_user(mock_get_jwks):
    # Tests `get_current_user` which is used to get the current user from the JWT token
    mock_get_jwks.return_value = ({"keys": [TEST_PUBLIC_KEY]}, "test/v2.0")
    os.environ["IQENGINE_APP_ID"] = "test"
    os.environ["IQENGINE_APP_AUTHORITY"] = "test"
    credentials = Mock(credentials=VALID_TEST_TOKEN)
    current_user = get_current_user(token=credentials)
    assert current_user["preferred_username"] == "JohnDoe@test.com"
