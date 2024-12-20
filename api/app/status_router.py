from .database import db
from fastapi import APIRouter
from pymongo.errors import ServerSelectionTimeoutError

router = APIRouter()


@router.get("/api/status")
async def get_status():
    # Validate system functionality
    try:
        await db().datasources.database.command("ping")
    except ServerSelectionTimeoutError:
        return "No Database Connection Available"
    return "OK"
