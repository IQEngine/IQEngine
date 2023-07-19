from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from cachetools import TTLCache, cached
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicKey
from typing import Any, Tuple, cast
import jwt
from jwt import algorithms
import os
import time
import requests
import logging
import json

CLIENT_ID = os.getenv("IQENGINE_APP_ID")
TENANT_ID = os.getenv("AAD_Tenant_ID")

http_bearer = HTTPBearer()


class JWKSHandler:
    openid_config_uri = "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration"
    jwks_cache: TTLCache[str, Any] = TTLCache(maxsize=1, ttl=600)  # cache the JWKS for 10 minutes

    @classmethod
    def get_openid_config(cls):
        try:
            return requests.get(cls.openid_config_uri).json()
        except Exception as e:
            logging.error(f"Failed to fetch OpenID configuration: {e}")
            raise

    @classmethod
    @cached(cache=jwks_cache)
    def get_jwks(cls):
        openid_config = cls.get_openid_config()
        jwks_uri = openid_config['jwks_uri']
        issuer = openid_config['issuer']

        for _ in range(5):  # retry up to 5 times
            try:
                return requests.get(jwks_uri).json(), issuer
            except Exception as e:
                logging.error(f"Failed to update JWKS: {e}")
                time.sleep(5)
        raise Exception("Failed to update JWKS after 5 retries")


jwks_handler = JWKSHandler()


def validate_issuer_and_get_public_key(token: str) -> Tuple[RSAPublicKey, Any]:
    # Decode the token without verification to access the header
    unverified_header = jwt.get_unverified_header(token)
    unverified_payload = jwt.decode(token, options={"verify_signature": False})
    algorithm = unverified_header.get("alg")

    # Look up the public key in the JWKS using the `kid` from the JWT header
    jwks, issuer = jwks_handler.get_jwks()
    issuer = issuer.replace("{tenantid}", TENANT_ID)
    key = [k for k in jwks["keys"] if k["kid"] == unverified_header["kid"]][0]
    public_key = cast(RSAPublicKey, algorithms.RSAAlgorithm.from_jwk(json.dumps(key)))

    # Check issuer
    issuer = unverified_payload["iss"]
    if unverified_payload["iss"] != issuer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid issuer",
        )

    return public_key, algorithm


def validate_and_decode_jwt(token: str) -> dict:
    try:
        public_key, algorithm = validate_issuer_and_get_public_key(token)
        payload = jwt.decode(
            token, public_key, algorithms=[algorithm], audience=CLIENT_ID
        )  # Checks expiration, audience, and signature
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid JWT",
        )


def get_current_user(
      token: HTTPAuthorizationCredentials = Depends(http_bearer),) -> dict:
    try:
        payload = validate_and_decode_jwt(token.credentials)
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to validate credentials",
        )


def get_current_active_user(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["is_active"]:
        return current_user
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Inactive user",
    )


def get_current_active_admin_user(current_user: dict = Depends(get_current_user),) -> dict:
    if current_user["is_active"]:
        if (
            "roles" in current_user and "IQEngine-Admin" in current_user["roles"]
        ):
            return current_user
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have the necessary permissions",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user",
        )


# Example usage
# @app.get("/some-endpoint")
# def read_items(user: dict = Depends(get_current_active_user)):
#     # business logic here
#     return {"message": "You have access!"}
