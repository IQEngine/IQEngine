import os
import json
from unittest.mock import Mock, patch

from fastapi import HTTPException
from helpers.authorization import get_current_user, requires


def test_requires_with_valid_role():
    # Tests the decorator function `requires` which is used to restrict access to certain endpoints
    current_user = requires(
        "IQEngine-User",
        current_user={"roles": ["IQEngine-User"], "preferred_username": "emailaddress"},
    )
    assert current_user["preferred_username"] == "emailaddress"


def test_requires_with_invalid_role():
    # Tests the decorator function `requires` which is used to restrict access to certain endpoints
    try:
        _ = requires(
            "Invalid_role",
            current_user={
                "roles": ["IQEngine-User"],
                "preferred_username": "emailaddress",
            },
        )
    except HTTPException as e:
        assert e.status_code == 403
        assert e.detail == "Not enough privileges"


def test_requires_with_no_role():
    # Tests the decorator function `requires` which is used to restrict access to certain endpoints
    current_user = requires(
        current_user={"roles": ["IQEngine-User"], "preferred_username": "emailaddress"}
    )
    assert current_user["preferred_username"] == "emailaddress"


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
    mock_get_jwks.return_value = ({"keys": [TEST_PUBLIC_KEY]}, "test")
    os.environ["IQENGINE_APP_ID"] = "test"
    credentials = Mock(credentials=VALID_TEST_TOKEN)
    current_user = get_current_user(token=credentials)
    assert current_user["preferred_username"] == "emailaddress"
