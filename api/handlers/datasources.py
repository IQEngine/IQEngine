import database.database
from database.models import DataSource
from fastapi import APIRouter, Depends, HTTPException
from pymongo.collection import Collection

router = APIRouter()


@router.post("/api/datasources", status_code=201, response_model=DataSource)
def create_datasource(
    datasource: DataSource,
    datasources: Collection[DataSource] = Depends(
        database.database.datasources_collection
    ),
):
    """
    Create a new datasource. The datasource will be henceforth identified by accountName/containerName which
    must be unique or this function will return a 400.
    """
    if datasources.find_one(
        {
            "accountName": datasource.accountName,
            "containerName": datasource.containerName,
        }
    ):
        raise HTTPException(
            status_code=409, content={"error": "Datasource Already Exists"}
        )
    datasources.insert_one(datasource.dict(by_alias=True, exclude_unset=True))
    return datasource


@router.get("/api/datasources", response_model=list[DataSource])
def get_datasources(
    datasources_collection: Collection[DataSource] = Depends(
        database.database.datasources_collection
    ),
):
    datasources = datasources_collection.find()
    result = []
    for datasource in datasources:
        result.append(datasource)
    return result
