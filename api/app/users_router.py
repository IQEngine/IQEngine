from typing import Optional
import os
import msal
import requests
from fastapi import APIRouter, Depends, HTTPException
from helpers.authorization import required_roles

router = APIRouter()

@router.get("/api/users", status_code=200)
async def users(current_user: Optional[dict] = Depends(required_roles("IQEngine-Admin"))):
    try:
        # Create a confidential client application
        app = msal.ConfidentialClientApplication(
            client_id=os.getenv("IQENGINE_APP_ID"),
            authority=os.getenv("IQENGINE_APP_AUTHORITY"),
            client_credential=os.getenv("APP_SECRET"),
        )
        # Request an access token
        scopes = ["https://graph.microsoft.com/.default"]
        result = app.acquire_token_silent(scopes=scopes, account=None)
        if not result:
            result = app.acquire_token_for_client(scopes=scopes)
        access_token = result["access_token"]

        # Get users
        url = "https://graph.microsoft.com/v1.0/users?$expand=memberOf"
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            users = response.json()["value"]
        else:
            users = None
        return users
    except Exception:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")
