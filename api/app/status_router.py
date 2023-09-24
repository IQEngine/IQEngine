from . import datasources
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorCollection
from pymongo.errors import ServerSelectionTimeoutError

router = APIRouter()


@router.get("/api/status")
async def get_status(
    datasources_collection: AsyncIOMotorCollection = Depends(
        datasources.collection
    ),
):
    # Validate system functionality
    try:
        await datasources_collection.database.command("ping")
    except ServerSelectionTimeoutError:
        return "No Database Connection Available"
    return "OK"
