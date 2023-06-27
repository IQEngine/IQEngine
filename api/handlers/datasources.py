import database.database
from database.models import DataSource
from fastapi import APIRouter, Depends, HTTPException
from pydantic import SecretStr
from pymongo.collection import Collection
from fastapi.responses import StreamingResponse
import httpx

from .cipher import encrypt
from .urlmapping import add_URL_sasToken, apiType

router = APIRouter()


@router.post("/api/datasources", status_code=201, response_model=DataSource)
def create_datasource(
    datasource: DataSource,
    datasources: Collection[DataSource] = Depends(
        database.database.datasources_collection
    ),
):
    """
    Create a new datasource. The datasource will be henceforth identified by account/container which
    must be unique or this function will return a 400.
    """
    if datasources.find_one(
        {
            "account": datasource.account,
            "container": datasource.container,
        }
    ):
        raise HTTPException(status_code=409, detail="Datasource Already Exists")

    if datasource.sasToken:
        datasource.sasToken = encrypt(datasource.sasToken)

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


@router.get(
    "/api/datasources/{account}/{container}/image", response_class=StreamingResponse
)
async def get_datasource_image(
    account: str,
    container: str,
    datasources_collection: Collection[DataSource] = Depends(
        database.database.datasources_collection
    ),
):
    # Create the imageURL with sasToken
    datasource = datasources_collection.find_one(
        {
            "account": account,
            "container": container,
        }
    )
    if not datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")

    imageURL = add_URL_sasToken(account, container, datasource["sasToken"], "", apiType.IMAGE)

    async with httpx.AsyncClient() as client:
        response = await client.get(imageURL.get_secret_value())
    if response.status_code != 200:
        raise HTTPException(status_code=404, detail="Image not found")

    return StreamingResponse(response.iter_bytes(), media_type=response.headers["Content-Type"])


@router.get(
    "/api/datasources/{account}/{container}/datasource", response_model=DataSource
)
def get_datasource(
    account: str,
    container: str,
    datasources_collection: Collection[DataSource] = Depends(
        database.database.datasources_collection
    ),
):
    datasource = datasources_collection.find_one(
        {
            "account": account,
            "container": container,
        }
    )

    if not datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")

    return datasource


@router.put("/api/datasources/{account}/{container}/datasource", status_code=204)
def update_datasource(
    account: str,
    container: str,
    datasource: DataSource,
    datasources_collection: Collection[DataSource] = Depends(
        database.database.datasources_collection
    ),
):
    existingDatasource = datasources_collection.find_one(
        {
            "account": account,
            "container": container,
        }
    )
    if not existingDatasource:
        raise HTTPException(status_code=404, detail="Datasource not found")

    # If the incoming datasource has a sasToken, encrypt it and replace the existing one
    # Once encrypted sasToken is just a str not a SecretStr anymore
    if datasource.sasToken and isinstance(datasource.sasToken, SecretStr):
        datasource.sasToken = encrypt(datasource.sasToken)  # returns a str

    datasource_dict = datasource.dict(by_alias=True, exclude_unset=True)

    # if sasToken is "" or null then set it to a empty str instead of SecretStr
    if not datasource.sasToken:
        datasource_dict["sasToken"] = ""

    datasources_collection.update_one(
        {"account": account, "container": container},
        {"$set": datasource_dict},
    )

    return
