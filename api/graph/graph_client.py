import os

import msal
import requests


def get_token():
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

    return result["access_token"]


def get_users(access_token):
    url = "https://graph.microsoft.com/v1.0/users?$expand=memberOf"

    headers = {"Authorization": f"Bearer {access_token}"}

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        users = response.json()["value"]
        return users
    else:
        return None
