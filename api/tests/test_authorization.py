import pytest
import jwt
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from unittest.mock import patch
from helpers.authorization import JWKSHandler, validate_and_decode_jwt, get_current_user, get_current_active_user, get_current_active_admin_user

def test_get_jwks(mocker):
    # Mock the requests.get to return a response with the desired JWKS
    mocker.patch('requests.get', return_value=mocker.Mock(json=lambda: {"keys": "mock_jwks"}))

    # Initialize the JWKSHandler
    jwks_handler = JWKSHandler()

    # Call the function
    jwks_handler.get_jwks()

    # Get the JWKS from cache
    jwks_cache = jwks_handler.jwks_cache.get((JWKSHandler,))

    # Assert that the JWKS cache was updated as expected
    assert jwks_cache.get("keys") == "mock_jwks"


def test_get_jwks_failure(mocker):
    # Mock the requests.get to raise an exception
    mocker.patch('requests.get', side_effect=Exception("Mock exception"))

    # Initialize the JWKSHandler
    jwks_handler = JWKSHandler()

    # Call the function and assert that it raises the expected exception
    with pytest.raises(Exception, match="Failed to update JWKS after 5 retries"):
        jwks_handler.get_jwks()


def test_validate_and_decode_jwt(mocker):
    # Mock the validate_issuer_and_get_public_key function to return a public key and algorithm
    mocker.patch('helpers.authorization.validate_issuer_and_get_public_key', return_value=("mock_public_key", "HS256"))

    # Mock the jwt.decode to return a payload
    mocker.patch('jwt.decode', return_value={"payload": "mock_payload"})

    # Call the function with a mock token
    result = validate_and_decode_jwt("mock_token")

    # Assert that the function returned the expected payload
    assert result == {"payload": "mock_payload"}


def test_validate_and_decode_jwt_failure(mocker):
    # Mock the validate_issuer_and_get_public_key function to return a public key and algorithm
    mocker.patch('helpers.authorization.validate_issuer_and_get_public_key', return_value=("mock_public_key", "HS256"))

    # Mock the jwt.decode to raise a PyJWTError
    mocker.patch('jwt.decode', side_effect=jwt.PyJWTError)

    try:
        validate_and_decode_jwt("mock_token")
    except HTTPException as e:
        assert e.detail == "Invalid JWT"


def test_get_current_user(mocker):
    # Mock the validate_and_decode_jwt function to return a payload
    mocker.patch('helpers.authorization.validate_and_decode_jwt', return_value={"sub": "test_user"})

    # Create a mock token
    mock_token = HTTPAuthorizationCredentials(scheme="Bearer", credentials="mock_token")

    # Call the function and assert that it returns the expected payload
    assert get_current_user(mock_token) == {"sub": "test_user"}


def test_get_current_active_user():
    # Create a mock user dictionary
    mock_user = {"is_active": True, "name": "Test User"}

    # Call the get_current_active_user function with the mock user and assert that it returns the expected dictionary
    result = get_current_active_user(mock_user)
    assert result == {"is_active": True, "name": "Test User"}


def test_get_current_active_admin_user():
    # Create a mock user dictionary that includes the "IQEngine-Admin" role
    mock_admin_user = {"is_active": True, "name": "Test Admin User", "roles": ["IQEngine-Admin"]}

    # Call the get_current_active_admin_user function with the mock admin user and assert that it returns the expected dictionary
    result = get_current_active_admin_user(mock_admin_user)
    assert result == {"is_active": True, "name": "Test Admin User", "roles": ["IQEngine-Admin"]}

def test_get_current_active_admin_user_no_permission():
    # Create a mock user dictionary without the "IQEngine-Admin" role
    mock_admin_user = {"is_active": True, "name": "Test Admin User", "roles": ["Some-Other-Role"]}

    try:
        get_current_active_admin_user(mock_admin_user)
    except HTTPException as e:
        assert e.detail == "User does not have the necessary permissions"
        

def test_get_current_active_admin_user_inactive():
    # Create a mock user dictionary that is inactive
    mock_admin_user = {"is_active": False, "name": "Test Admin User", "roles": ["IQEngine-Admin"]}

    try:
        get_current_active_admin_user(mock_admin_user)
    except HTTPException as e:
        assert e.detail == "Inactive user"
