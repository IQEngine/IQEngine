from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from graph.graph_client import get_token, get_users
from helpers.authorization import required_roles

router = APIRouter()


@router.get("/api/users", status_code=200)
async def users(
    current_user: Optional[dict] = Depends(required_roles("IQEngine-Admin")),
):
    try:
        access_token = get_token()
        users = get_users(access_token)
        return users
    except Exception:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")
