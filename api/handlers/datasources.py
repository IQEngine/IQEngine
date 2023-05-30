import database.database
from fastapi import APIRouter, Depends, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pymongo.database import Database

router = APIRouter()


class Datasource(BaseModel):
    name: str
    accountName: str
    containerName: str
    description: str


# class GetDatasourcesResponse(BaseModel):
#    datasources: list


@router.post("/api/datasources", status_code=201)
def create_datasource(
    datasource: Datasource,
    response: Response,
    db: Database = Depends(database.database.db),
):
    """
    Create a new datasource. The datasource will be henceforth identified by accountName/containerName which
    must be unique or this function will return a 400.
    """
    if db.datasources.find_one(
        {
            "accountName": datasource.accountName,
            "containerName": datasource.containerName,
        }
    ):
        return JSONResponse(
            status_code=409, content={"error": "Datasource Already Exists"}
        )
    datasource_id = db.datasources.insert_one(datasource.dict()).inserted_id
    return JSONResponse(status_code=201, content={"datasource_id": str(datasource_id)})


@router.get("/api/datasources")
def get_datasources(
    db: Database = Depends(database.database.db),
):
    datasources = db.datasources.find()
    result = []
    for datasource in datasources:
        datasource["_id"] = str(datasource["_id"])
        result.append(datasource)
    return JSONResponse(status_code=200, content=result)
