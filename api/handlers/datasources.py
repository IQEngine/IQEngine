from typing import Optional

import httpx
from blob.azure_client import AzureBlobClient
from database import datasource_repo
from database.datasource_repo import create, datasource_exists
from database.models import DataSource
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import StreamingResponse
from helpers.authorization import get_current_user
from helpers.cipher import decrypt, encrypt
from helpers.datasource_access import check_access
from helpers.urlmapping import ApiType, add_URL_sasToken
from motor.core import AgnosticCollection
from pydantic import SecretStr

router = APIRouter()


@router.post("/api/datasources", status_code=201, response_model=DataSource)
async def create_datasource(
    datasource: DataSource,
    datasources: AgnosticCollection = Depends(datasource_repo.collection),
    current_user: dict = Depends(get_current_user),
):
    """
    Create a new datasource. The datasource will be henceforth identified by account/container which
    must be unique or this function will return a 400.
    """
    if await datasource_exists(datasource.account, datasource.container):
        raise HTTPException(status_code=409, detail="Datasource Already Exists")

    datasource = await create(datasource=datasource, user=current_user)
    return datasource


@router.get("/api/datasources", response_model=list[DataSource])
async def get_datasources(
    datasources_collection: AgnosticCollection = Depends(datasource_repo.collection),
    current_user: Optional[dict] = Depends(get_current_user),
):
    datasources = datasources_collection.find()
    result = []
    async for datasource_item in datasources:
        if (
            await check_access(
                datasource_item["account"], datasource_item["container"], current_user
            )
            is not None
        ):
            result.append(datasource_item)
    return result


@router.get(
    "/api/datasources/{account}/{container}/image", response_class=StreamingResponse
)
async def get_datasource_image(
    account: str,
    container: str,
    datasources_collection: AgnosticCollection = Depends(datasource_repo.collection),
    access_allowed=Depends(check_access),
):
    if access_allowed is None:
        raise HTTPException(status_code=403, detail="No Access")

    # Create the imageURL with sasToken
    datasource = await datasources_collection.find_one(
        {
            "account": account,
            "container": container,
        }
    )
    if not datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")

    if not datasource["sasToken"]:
        datasource["sasToken"] = ""  # set to empty str if null

    imageURL = add_URL_sasToken(
        account, container, datasource["sasToken"], "", ApiType.IMAGE
    )

    async with httpx.AsyncClient() as client:
        response = await client.get(imageURL.get_secret_value())
    if response.status_code != 200:
        raise HTTPException(status_code=404, detail="Image not found")

    return StreamingResponse(
        response.iter_bytes(), media_type=response.headers["Content-Type"]
    )


@router.get(
    "/api/datasources/{account}/{container}/datasource", response_model=DataSource
)
async def get_datasource(
    datasource: DataSource = Depends(datasource_repo.get),
    current_user: Optional[dict] = Depends(get_current_user),
):
    if not datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")

    return datasource


@router.put("/api/datasources/{account}/{container}/datasource", status_code=204)
async def update_datasource(
    account: str,
    container: str,
    datasource: DataSource,
    datasources_collection: AgnosticCollection = Depends(datasource_repo.collection),
    access_allowed=Depends(check_access),
):
    if access_allowed is None:
        raise HTTPException(status_code=403, detail="No Access")
    existing_datasource = await datasources_collection.find_one(
        {
            "account": account,
            "container": container,
        }
    )
    if not existing_datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")
    # If the incoming datasource has a sasToken or account_key, encrypt it and replace the existing one
    # Once encrypted sasToken or account_key is just a str not a SecretStr anymore
    if datasource.sasToken and isinstance(datasource.sasToken, SecretStr):
        datasource.sasToken = encrypt(datasource.sasToken)  # returns a str
    if datasource.account_key and isinstance(datasource.account_key, SecretStr):
        datasource.account_key = encrypt(datasource.account_key)
    datasource_dict = datasource.dict(by_alias=True, exclude_unset=True)
    # if sasToken is "" or null then set it to a empty str instead of SecretStr
    if not datasource.sasToken:
        datasource_dict["sasToken"] = ""
    await datasources_collection.update_one(
        {"account": account, "container": container},
        {"$set": datasource_dict},
    )
    return


@router.put("/api/datasources/{account}/{container}/sync", status_code=204)
async def sync_datasource(
    account: str,
    container: str,
    background_tasks: BackgroundTasks,
    datasources_collection: AgnosticCollection = Depends(datasource_repo.collection),
    current_user: Optional[dict] = Depends(get_current_user),
    access_allowed=Depends(check_access),
):
    if access_allowed is None:
        raise HTTPException(status_code=403, detail="No Access")

    existing_datasource = await datasources_collection.find_one(
        {
            "account": account,
            "container": container,
        }
    )
    if not existing_datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")
    background_tasks.add_task(datasource_repo.sync, account, container)
    return {"message": "Syncing"}


@router.get("/api/datasources/{account}/{container}/{file_path}/sas")
async def generate_sas_token(
    account: str,
    container: str,
    file_path: str,
    datasources_collection: AgnosticCollection = Depends(datasource_repo.collection),
    current_user: Optional[dict] = Depends(get_current_user),
    access_allowed=Depends(check_access),
):
    token: str = ""
    existing_datasource = await datasources_collection.find_one(
        {
            "account": account,
            "container": container,
        }
    )
    if not existing_datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")
    if not existing_datasource.get("account_key", None):
        if access_allowed == "public":
            return {"sasToken": None}
        if not existing_datasource["sasToken"]:
            raise HTTPException(status_code=404, detail="No Account Key or SAS Token")
        if access_allowed is None:
            raise HTTPException(status_code=403, detail="No Access")
        token = decrypt(existing_datasource["sasToken"]).get_secret_value()
    if not token:
        blob_client = AzureBlobClient(account, container)
        try:
            token = blob_client.generate_sas_token(
                file_path,
                decrypt(existing_datasource["account_key"]).get_secret_value(),
            )
        except Exception:
            raise HTTPException(status_code=500, detail="unable to generate sas token")
    return {"sasToken": token}
