import json
import logging
import os
import time
from typing import Any, List, Optional, Tuple, Union, cast

import jwt
import requests
from cachetools import TTLCache, cached
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicKey
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from jwt import algorithms

TENANT_ID = os.getenv("AAD_Tenant_ID")

http_bearer = HTTPBearer()


class JWKSHandler:
    openid_config_uri = (
        "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration"
    )
    jwks_cache: TTLCache[str, Any] = TTLCache(
        maxsize=1, ttl=600
    )  # cache the JWKS for 10 minutes

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
        jwks_uri = openid_config["jwks_uri"]
        issuer = openid_config["issuer"]

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
    # issuer = unverified_payload["iss"]
    if unverified_payload["iss"] != issuer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid issuer",
        )

    return public_key, algorithm


def validate_and_decode_jwt(token: str) -> dict:
    try:
        CLIENT_ID = os.getenv("IQENGINE_APP_ID")
        public_key, algorithm = validate_issuer_and_get_public_key(token)
        payload = jwt.decode(
            token, public_key, algorithms=[algorithm], audience=CLIENT_ID
        )  # Checks expiration, audience, and signature
        return payload
    except jwt.PyJWTError as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid JWT",
        )


def get_current_user(
    token: Optional[str] = Depends(http_bearer),
) -> Optional[dict]:
    if not token:
        return None
    try:
        current_user = validate_and_decode_jwt(token.credentials)
        logging.info(
            f"User {current_user['preferred_username']} access token validated"
        )
        return current_user
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to validate credentials",
        )
    except AttributeError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No Authorization token provided",
        )


def requires(
    roles: Optional[Union[str, List[str]]] = None,
    current_user: Optional[dict] = Depends(get_current_user),
):
    if not current_user:
        return None

    if roles:
        if isinstance(roles, str):
            roles = [roles]
        if not any(role in current_user["roles"] for role in roles):
            logging.info(
                f"User {current_user['preferred_username']} attempted to access without sufficient privileges"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough privileges",
            )
    logging.info(f"User {current_user['preferred_username']} accessed successfully")
    return current_user


# Example usage
# @app.get("/some-endpoint")
# def read_items(test:str, dependencies=[Depends(requires("IQEngine-User"))]):
#     # business logic here
#     return {"message": "You have access!"}