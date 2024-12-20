import jwt
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from helpers.authorization import JWKSHandler, get_current_user, validate_and_decode_jwt


def test_get_jwks(mocker):
    # Mock the requests.get to return a response with the desired OpenID Config and JWKS
    openid_config_response = {"jwks_uri": "mock_jwks_uri", "issuer": "mock_issuer"}
    jwks_response = {"keys": "mock_jwks"}

    mocker.patch(
        "requests.get",
        side_effect=[
            mocker.Mock(json=lambda: openid_config_response),
            mocker.Mock(json=lambda: jwks_response),
        ],
    )

    jwks_handler = JWKSHandler()
    jwks, issuer = jwks_handler.get_jwks()

    assert jwks.get("keys") == "mock_jwks"
    assert issuer == "mock_issuer"


def test_get_jwks_failure(mocker):
    # Mock the requests.get to raise an exception
    mocker.patch(
        "requests.get",
        side_effect=[
            mocker.Mock(json=lambda: {"jwks_uri": "mock_jwks_uri", "issuer": "mock_issuer"}),
            Exception("Mock exception"),
        ],
    )
    jwks_handler = JWKSHandler()

    try:
        jwks_handler.get_jwks()
    except Exception as e:
        assert str(e) == "Failed to update JWKS after 5 retries"


def test_validate_and_decode_jwt(mocker):
    # Mock the validate_issuer_and_get_public_key function to return a public key and algorithm
    mocker.patch(
        "helpers.authorization.validate_issuer_and_get_public_key",
        return_value=("mock_public_key", "HS256"),
    )
    mocker.patch("jwt.decode", return_value={"payload": "mock_payload"})
    result = validate_and_decode_jwt("mock_token")

    # Assert that the function returned the expected payload
    assert result == {"payload": "mock_payload"}


def test_validate_and_decode_jwt_failure(mocker):
    # Mock the validate_issuer_and_get_public_key function to return a public key and algorithm
    mocker.patch(
        "helpers.authorization.validate_issuer_and_get_public_key",
        return_value=("mock_public_key", "HS256"),
    )
    mocker.patch("jwt.decode", side_effect=jwt.PyJWTError)

    try:
        validate_and_decode_jwt("mock_token")
    except HTTPException as e:
        assert e.detail == "Invalid JWT"


def test_get_current_user(mocker):
    # Mock the validate_and_decode_jwt function to return a payload
    mocker.patch(
        "helpers.authorization.validate_and_decode_jwt",
        return_value={"preferred_username": "test_user", "roles": ["role1"]},
    )
    mock_token = HTTPAuthorizationCredentials(scheme="Bearer", credentials="mock_token")

    # Call the function and assert that it returns the expected payload
    user = get_current_user(mock_token)
    assert user == {"preferred_username": "test_user", "roles": ["role1"]}
