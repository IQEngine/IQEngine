from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os


SECRET_KEY = os.getenv("AAD_Auth_Key") # Secret key used for JWT. Should be in a Key Vault
ALGORITHM = "RS256"  # Hashing algorithm used for JWT
CLIENT_ID = os.getenv("AAD_Client_ID") # Client ID of the application registered in Azure AD

http_bearer = HTTPBearer()

def get_current_user(token: HTTPAuthorizationCredentials = Depends(http_bearer)) -> dict:
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=ALGORITHM, audience="CLIENT_ID")
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid JWT",
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