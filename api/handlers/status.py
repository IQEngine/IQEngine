from database import datasource_repo
from database.models import DataSource
from fastapi import APIRouter, Depends
from pymongo.collection import Collection
from pymongo.errors import ServerSelectionTimeoutError

router = APIRouter()


@router.get("/api/status")
def get_status(
    datasources_collection: Collection[DataSource] = Depends(
        datasource_repo.collection
    ),
):
    # Validate system functionality
    try:
        datasources_collection.database.command("ping")
    except ServerSelectionTimeoutError:
        return "No Database Connection Available"
    return "OK"
