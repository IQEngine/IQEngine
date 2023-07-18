from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os
import schedule
import time
import threading
import requests
import logging


CLIENT_ID = os.getenv("AAD_Client_ID") # Client ID of the application registered in Azure AD

http_bearer = HTTPBearer()
jwks_uri = "https://login.microsoftonline.com/common/discovery/keys"
jwks_cache = {}


def update_jwks(retries: int = 5, delay: int = 5):
    global jwks_cache
    for i in range(retries):
        try:
            jwks_cache = requests.get(jwks_uri).json()
            break
        except Exception as e:
            logging.error(f"Failed to update JWKS: {e}")
            if i < retries - 1:  # Don't delay after the last retry
                time.sleep(delay)
            else:
                raise


# Update the JWKS immediately and then every 10 minutes
update_jwks()
schedule.every(10).minutes.do(update_jwks)


def run_scheduler():
    while True:
        schedule.run_pending()
        time.sleep(1)


scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
scheduler_thread.start()


def validate_issuer_and_get_public_key(token: str) -> str:
    # Decode the token without verification to access the header
    unverified_header = jwt.get_unverified_header(token)
    unverified_payload = jwt.decode(token, options={"verify_signature": False})
    algorithm = unverified_header.get("alg")

    # Check issuer
    issuer = unverified_payload["iss"]
    if issuer != "https://login.microsoftonline.com/{your_tenant_id}/v2.0":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid issuer",
        )

    # Look up the public key in the JWKS using the `kid` from the JWT header
    key = [k for k in jwks_cache["keys"] if k["kid"] == unverified_header["kid"]][0]
    public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)

    return public_key, algorithm


def validate_and_decode_jwt(token: str, retry: bool = True) -> dict:
    try:
        public_key, algorithm = validate_issuer_and_get_public_key(token)
        payload = jwt.decode(token, public_key, algorithms=algorithm, audience=CLIENT_ID) # Checks expiration, audience, and signature
        return payload
    except jwt.PyJWTError:
        if retry:
            # The validation failed, possibly due to key rotation. Refresh the JWKS and retry once.
            update_jwks()
            return validate_and_decode_jwt(token, retry=False)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid JWT",
            )


def get_current_user(token: HTTPAuthorizationCredentials = Depends(http_bearer)) -> dict:
    try:
        payload = validate_and_decode_jwt(token.credentials)
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to validate credentials",
        )


# Validate that a user account is not deactivated or suspended while still having a valid JWT
def get_current_active_user(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["is_active"]:
        return current_user
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Inactive user",
    )


def get_current_active_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["is_active"]:
        if "roles" in current_user and "admin" in current_user["roles"]: # change to appropriate admin role
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