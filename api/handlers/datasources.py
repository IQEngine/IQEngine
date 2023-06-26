import database.database
from database.models import DataSource
from fastapi import APIRouter, Depends, HTTPException
from pydantic import SecretStr
from pymongo.collection import Collection
from fastapi.responses import StreamingResponse
import httpx

from .cipher import decrypt, encrypt

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


def add_imageURL_sasToken(datasource):
    if (
        "imageURL" in datasource
        and "sasToken" in datasource
        and datasource["sasToken"] is not None
        and datasource["sasToken"] != ""
        and "core.windows.net" in datasource["imageURL"]
):
        # linter fix for error: "get_secret_value" is not a known member of "None" (reportOptionalMemberAccess)
        x = decrypt(datasource["sasToken"])
        y = ""
        if x is not None:
            y = x.get_secret_value()
        imageURL_sasToken = SecretStr(datasource["imageURL"] + "?" + y)
        return imageURL_sasToken
    else:
        return SecretStr(datasource["imageURL"])
    

@router.get("/api/datasources", response_model=list[DataSource])
def get_datasources(
    datasources_collection: Collection[DataSource] = Depends(
        database.database.datasources_collection
    ),
):
    datasources = datasources_collection.find()
    result = []
    for datasource in datasources:
        datasource["imageURL"] = f'/api/datasources/{datasource["account"]}/{datasource["container"]}/image'
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

    imageURL = add_imageURL_sasToken(datasource)
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

    datasource["imageURL"] = f'/api/datasources/{datasource["account"]}/{datasource["container"]}/image'
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
