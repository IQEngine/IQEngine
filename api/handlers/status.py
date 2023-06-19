from fastapi import APIRouter, Depends
from pymongo.collection import Collection
import database.database
from database.models import DataSource
from pymongo.errors import ServerSelectionTimeoutError

router = APIRouter()


@router.get("/api/status")
def get_status(
    datasources_collection: Collection[DataSource] = Depends(
        database.database.datasources_collection),
        ):
    # Validate system functionality
    try:
        datasources_collection.database.command("ping")
    except ServerSelectionTimeoutError:
        return "No Database Connection Available"
    return "OK"
