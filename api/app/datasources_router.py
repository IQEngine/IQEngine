import os
import json
import httpx
from .azure_client import AzureBlobClient
from . import datasources
from .datasources import create_datasource, datasource_exists
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from helpers.authorization import get_current_user
from helpers.cipher import decrypt, encrypt
from helpers.datasource_access import check_access
from helpers.urlmapping import ApiType, add_URL_sasToken, get_content_type, get_file_name
from motor.core import AgnosticCollection
from pydantic import SecretStr
from datetime import datetime
from typing import List, Optional
from .metadata import InvalidGeolocationFormat, query_metadata, collection, get_metadata, versions_collection
from .models import DataSource, DataSourceReference, Metadata, TrackMetadata, Configuration
from . import aiquery

router = APIRouter()


@router.post("/api/datasources", status_code=201, response_model=DataSource)
async def create_datasource_endpoint(
    datasource: DataSource,
    datasources: AgnosticCollection = Depends(datasources.collection),
    current_user: dict = Depends(get_current_user),
):
    """
    Create a new datasource. The datasource will be henceforth identified by account/container which
    must be unique or this function will return a 400.
    """
    if await datasource_exists(datasource.account, datasource.container):
        raise HTTPException(status_code=409, detail="Datasource Already Exists")

    datasource = await create_datasource(datasource=datasource, user=current_user)
    return datasource


@router.get("/api/datasources", response_model=list[DataSource])
async def get_datasources(
    datasources_collection: AgnosticCollection = Depends(datasources.collection),
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


@router.put("/api/datasources/syncAll", status_code=204)
async def sync_all_datasources(
    background_tasks: BackgroundTasks,
    datasources_collection: AgnosticCollection = Depends(datasources.collection),
):
    # Check if the feature is enabled, for anyone to be able to sync all
    feature_flags = os.getenv("IQENGINE_FEATURE_FLAGS", None)
    if feature_flags:
        configuration = Configuration()
        configuration.feature_flags = json.loads(feature_flags)
        if configuration.feature_flags.get('allowRefreshing', False):
            # First wipe out all the metadata
            from .metadata import collection
            metadata_collection = collection()
            await metadata_collection.delete_many({}) # deletes all docs in the collection

            # Now sync all the datasources
            all_datasources = datasources_collection.find()
            all_datasources_list = await all_datasources.to_list(length=100)
            for datasource in all_datasources_list:
                print("Syncing-", datasource)
                background_tasks.add_task(datasources.sync, datasource["account"], datasource["container"])
        else:
            raise HTTPException(status_code=404, detail="allowRefreshing wasn't set to true in env vars")
    return {"message": "Syncing All"}


@router.get("/api/datasources/{account}/{container}/image", response_class=StreamingResponse)
async def get_datasource_image(
    account: str,
    container: str,
    datasources_collection: AgnosticCollection = Depends(datasources.collection),
    access_allowed=Depends(check_access),
):
    if access_allowed is None:
        raise HTTPException(status_code=403, detail="No Access")

    # Create the imageURL with sasToken
    datasource = await datasources_collection.find_one({"account": account, "container": container})
    if not datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")

    if not datasource["sasToken"]:
        datasource["sasToken"] = ""  # set to empty str if null

    imageURL = add_URL_sasToken(account, container, datasource["sasToken"], "", ApiType.IMAGE)

    async with httpx.AsyncClient() as client:
        response = await client.get(imageURL.get_secret_value())
    if response.status_code != 200:
        raise HTTPException(status_code=404, detail="Image not found")

    return StreamingResponse(response.iter_bytes(), media_type=response.headers["Content-Type"])


@router.get(
    "/api/datasources/{account}/{container}/datasource", response_model=DataSource
)
async def get_datasource(
    datasource: DataSource = Depends(datasources.get),
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
    datasources_collection: AgnosticCollection = Depends(datasources.collection),
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
    if datasource.sasToken and (datasource.sasToken.get_secret_value() != "**********"):
        datasource.sasToken = encrypt(datasource.sasToken)  # returns a str
    if datasource.accountKey and (datasource.accountKey.get_secret_value() != "**********"):
        datasource.accountKey = encrypt(datasource.accountKey)
    datasource_dict = datasource.dict(by_alias=True, exclude_unset=True)
    # if sasToken is "" or null then set it to a empty str instead of SecretStr
    if not datasource.sasToken:
        datasource_dict["sasToken"] = ""
    if not datasource.accountKey:
        datasource_dict["accountKey"] = ""

    # if sasToken or accountKey is SecretStr, pop it from the dict so not to overwrite the existing one
    # as incoming datasource parameter will not have sasToken or accountKey but ***********
    if isinstance(datasource_dict["sasToken"], SecretStr):
        datasource_dict.pop("sasToken")
    if isinstance(datasource_dict["accountKey"], SecretStr):
        datasource_dict.pop("accountKey")

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
    datasources_collection: AgnosticCollection = Depends(datasources.collection),
    current_user: Optional[dict] = Depends(get_current_user),
    access_allowed=Depends(check_access),
):
    if access_allowed is None:
        raise HTTPException(status_code=403, detail="No Access")

    if current_user is None or 'preferred_username' not in current_user:
        raise HTTPException(status_code=403, detail="No Access")

    existing_datasource = await datasources_collection.find_one(
        {
            "account": account,
            "container": container,
        }
    )
    if not existing_datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")

    background_tasks.add_task(datasources.sync, account, container, current_user["preferred_username"])
    return {"message": "Syncing"}


@router.get("/api/datasources/{account}/{container}/{file_path}/sas")
async def generate_sas_token(
    account: str,
    container: str,
    file_path: str,
    write: bool = Query(False),
    datasources_collection: AgnosticCollection = Depends(datasources.collection),
    access_allowed=Depends(check_access),
):
    if (access_allowed != "owner" and write) or access_allowed is None:
        raise HTTPException(status_code=403, detail="No Access")
    if account == "local":
        return {"sasToken": None}
    token: str = ""
    existing_datasource = await datasources_collection.find_one(
        {
            "account": account,
            "container": container,
        }
    )
    if not existing_datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")
    if not existing_datasource.get("accountKey", None):
        if access_allowed == "public":
            return {"sasToken": None}
        if not existing_datasource["sasToken"]:
            raise HTTPException(status_code=404, detail="No Account Key or SAS Token")
        if access_allowed is None:
            raise HTTPException(status_code=403, detail="No Access")
        if not write:
            token = decrypt(existing_datasource["sasToken"]).get_secret_value()
    if not token:
        blob_client = AzureBlobClient(account, container)
        try:
            token = blob_client.generate_sas_token(
                file_path,
                decrypt(existing_datasource["accountKey"]).get_secret_value(),
                write,
            )
        except Exception:
            raise HTTPException(status_code=500, detail="unable to generate sas token")
    return {"sasToken": token}

@router.get(
    "/api/datasources/{account}/{container}/meta",
    status_code=200,
    response_model=list[Metadata],
)
async def get_all_meta(
    account,
    container,
    metadatas: AgnosticCollection = Depends(collection),
    access_allowed=Depends(check_access),
):
    if access_allowed is None:
        return []

    # Return all metadata for this datasource, could be an empty list
    metadata = metadatas.find(
        {
            "global.traceability:origin.account": account,
            "global.traceability:origin.container": container,
        }
    )
    result = []
    async for datum in metadata:
        result.append(datum)
    return result


@router.get(
    "/api/datasources/{account}/{container}/meta/paths",
    status_code=200,
    response_model=list[str],
)
async def get_all_meta_name(
    account,
    container,
    metadata_source: AgnosticCollection = Depends(collection),
    access_allowed=Depends(check_access),
):
    if access_allowed is None:
        return []

    metadata = metadata_source.find(
        {
            "global.traceability:origin.account": account,
            "global.traceability:origin.container": container,
        },
        {
            "_id": 0,
            "global.traceability:origin.file_path": 1,
        },
    )
    result = []
    async for datum in metadata:
        result.append(datum["global"]["traceability:origin"]["file_path"])
    return result


@router.get(
    "/api/datasources/{account}/{container}/{filepath:path}/meta",
    response_model=Metadata,
)
async def get_meta(
    metadata: Metadata = Depends(get_metadata),
    access_allowed=Depends(check_access),
):
    if access_allowed is None:
        raise HTTPException(status_code=403, detail="No Access")
    if not metadata:
        raise HTTPException(status_code=404, detail="Metadata not found")
    return metadata


@router.get(
    "/api/datasources/{account}/{container}/{filepath:path}/track",
    response_model=TrackMetadata,
)
async def get_track_meta(
    metadata: Metadata = Depends(get_metadata),
    access_allowed=Depends(check_access),
):
    if access_allowed is None:
        raise HTTPException(status_code=403, detail="No Access")

    if not metadata:
        raise HTTPException(status_code=404, detail="Metadata not found")

    return TrackMetadata(
        iqengine_geotrack=metadata.globalMetadata.__dict__.get("iqengine:geotrack"),
        description=metadata.globalMetadata.core_description,
        account=metadata.globalMetadata.traceability_origin.account
        if metadata.globalMetadata.traceability_origin is not None
        else None,
        container=metadata.globalMetadata.traceability_origin.container
        if metadata.globalMetadata.traceability_origin is not None
        else None,
    )


@router.get(
    "/api/datasources/{account}/{container}/{filepath:path}.jpg",
    response_class=StreamingResponse,
)
async def get_meta_thumbnail(
    filepath: str,
    background_tasks: BackgroundTasks,
    datasource: DataSource = Depends(datasources.get),
    azure_client: AzureBlobClient = Depends(AzureBlobClient),
    # access_allowed=Depends(check_access)
):
    # access_allowed is always None because the API url is referenced directly in the UI HTML
    # No authorization header is added to the request so the access_allowed is always None
    if not datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")
    
    sas_token = datasource.sasToken.get_secret_value() if datasource.sasToken else None
    if sas_token is not None:
        azure_client.set_sas_token(decrypt(sas_token))

    account_key = (
        datasource.accountKey.get_secret_value() if datasource.accountKey else None
    )
    if account_key is not None:
        azure_client.set_account_key(decrypt(account_key))

    thumbnail_path = get_file_name(filepath, ApiType.THUMB)
    content_type = get_content_type(ApiType.THUMB)
    if not await azure_client.blob_exist(thumbnail_path):
        metadata = await get_metadata(
            datasource.account,
            datasource.container,
            filepath,
        )
        if not metadata:
            raise HTTPException(status_code=404, detail="Metadata not found")
        datatype = metadata.globalMetadata.core_datatype
        image = await azure_client.get_new_thumbnail(
            data_type=datatype, filepath=filepath
        )
        # Upload the thumbnail in the background
        background_tasks.add_task(
            azure_client.upload_blob, filepath=thumbnail_path, data=image
        )
        return Response(content=image, media_type=content_type)
    content = await azure_client.get_blob_content(thumbnail_path)

    return Response(content=content, media_type=content_type)


@router.get(
    "/api/datasources/query",
    status_code=200,
    response_model=list[DataSourceReference],
)
async def query_meta(
    account: Optional[List[str]] = Query([]),
    container: Optional[List[str]] = Query([]),
    database_id: Optional[List[str]] = Query([]),
    min_frequency: Optional[float] = Query(None),
    max_frequency: Optional[float] = Query(None),
    author: Optional[str] = Query(None),
    label: Optional[str] = Query(None),
    comment: Optional[str] = Query(None),
    description: Optional[str] = Query(None),  # global description
    min_datetime: Optional[datetime] = Query(None),
    max_datetime: Optional[datetime] = Query(None),
    text: Optional[str] = Query(None),
    captures_geo: Optional[str] = Query(None),
    annotations_geo: Optional[str] = Query(None),
    current_user: Optional[dict] = Depends(get_current_user),
):
    try:
        result = await query_metadata(
            account=account,
            container=container,
            database_id=database_id,
            min_frequency=min_frequency,
            max_frequency=max_frequency,
            author=author,
            description=description,
            label=label,
            comment=comment,
            captures_geo=captures_geo,
            annotations_geo=annotations_geo,
            min_datetime=min_datetime,
            max_datetime=max_datetime,
            text=text,
        )

        if not result:
            return []

        # Process result to remove metadata from unauthorized datasources
        access_cache = {}
        filtered_result = []

        for item in result:
            key = (item.account, item.container)
            if key not in access_cache:
                access_cache[key] = await check_access(
                    item.account, item.container, current_user
                )

            if access_cache[key] is not None:
                filtered_result.append(item)

        return filtered_result

    except InvalidGeolocationFormat as e:
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        print(f"Error querying metadata: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


@router.get(
    "/api/datasources/open-query",
    status_code=200,
    response_model=None,
)
async def open_query_meta(
    query: str,
    current_user: Optional[dict] = Depends(get_current_user),
):
    if not aiquery.is_open_ai_available():
        return {
            "parameters": "",
            "results": []
        }
    if not query:
        return {
            "parameters": "",
            "results": []
        }
    jsonParameters = aiquery.get_query_result(query)
    if not jsonParameters:
        return {
            "parameters": "",
            "results": []
        }
    account = jsonParameters.get("account")
    container = jsonParameters.get("container")
    database_id = jsonParameters.get("database_id")
    min_frequency = jsonParameters.get("min_frequency")
    max_frequency = jsonParameters.get("max_frequency")
    author = jsonParameters.get("author")
    description = jsonParameters.get("description")
    label = jsonParameters.get("label")
    comment = jsonParameters.get("comment")
    captures_geo = jsonParameters.get("captures_geo")
    annotations_geo = jsonParameters.get("annotations_geo")
    min_datetime = jsonParameters.get("min_datetime")
    max_datetime = jsonParameters.get("max_datetime")
    captures_geo_json = jsonParameters.get("captures_geo_json")
    captures_radius = jsonParameters.get("captures_radius")
    annotations_geo_json = jsonParameters.get("annotations_geo_json")
    annotations_radius = jsonParameters.get("annotations_radius")
    text = jsonParameters.get("text")

    if min_datetime:
        min_datetime = datetime.fromisoformat(min_datetime.replace("Z", "+00:00"))
    if max_datetime:
        max_datetime = datetime.fromisoformat(max_datetime.replace("Z", "+00:00"))

    try:
        result = await query_metadata(
            account=account,
            container=container,
            database_id=database_id,
            min_frequency=min_frequency,
            max_frequency=max_frequency,
            author=author,
            description=description,
            label=label,
            comment=comment,
            captures_geo=captures_geo,
            annotations_geo=annotations_geo,
            min_datetime=min_datetime,
            max_datetime=max_datetime,
            captures_geo_json=captures_geo_json,
            captures_radius=captures_radius,
            annotations_geo_json=annotations_geo_json,
            annotations_radius=annotations_radius,
            text=text,
        )

        if not result:
            return {
                "parameters": jsonParameters,
                "results": []
            }

        # Process result to remove metadata from unauthorized datasources
        access_cache = {}
        filtered_result = []

        for item in result:
            key = (item.account, item.container)
            if key not in access_cache:
                access_cache[key] = await check_access(
                    item.account, item.container, current_user
                )

            if access_cache[key] is not None:
                filtered_result.append(item)

        return {
            "parameters": jsonParameters,
            "results": filtered_result
        }

    except InvalidGeolocationFormat as e:
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        print(f"Error querying metadata: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


@router.post(
    "/api/datasources/{account}/{container}/{filepath:path}/meta",
    status_code=201,
    response_model=Metadata,
)
async def create_meta(
    account: str,
    container: str,
    filepath: str,
    metadata: Metadata,
    datasources: AgnosticCollection = Depends(datasources.collection),
    metadatas: AgnosticCollection = Depends(collection),
    versions: AgnosticCollection = Depends(versions_collection),
    current_user=Depends(get_current_user),
    access_allowed=Depends(check_access),
):
    if access_allowed != "owner":
        raise HTTPException(status_code=403, detail="No Access")
    # Check datasource id is valid
    datasource = await datasources.find_one(
        {"account": account, "container": container}
    )
    if not datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")

    # Check metadata doesn't already exist
    if await metadatas.find_one(
        {
            "global.traceability:origin.account": account,
            "global.traceability:origin.container": container,
            "global.traceability:origin.file_path": filepath,
        }
    ):
        raise HTTPException(status_code=409, detail="Metadata already exists")

    # Create the first metadata record
    metadata.globalMetadata.traceability_origin = DataSourceReference(
        **{
            "type": "api",
            "account": account,
            "container": container,
            "file_path": filepath,
        }
    )
    metadata.globalMetadata.traceability_revision = 0
    await metadatas.insert_one(
        metadata.dict(by_alias=True, exclude_unset=True, exclude_none=True)
    )

    # audit document
    audit_document = {
        "metadata": metadata.dict(by_alias=True, exclude_unset=True, exclude_none=True),
        "user": current_user["preferred_username"],
        "action": "create",
    }
    await versions.insert_one(audit_document)
    return metadata


@router.put(
    "/api/datasources/{account}/{container}/{filepath:path}/meta", status_code=204
)
async def update_meta(
    account,
    container,
    filepath,
    metadata: Metadata,
    metadatas: AgnosticCollection = Depends(collection),
    versions: AgnosticCollection = Depends(versions_collection),
    current_user=Depends(get_current_user),
    access_allowed=Depends(check_access),
):
    if access_allowed != "owner":
        raise HTTPException(status_code=403, detail="No Access")

    current = await metadatas.find_one(
        {
            "global.traceability:origin.account": account,
            "global.traceability:origin.container": container,
            "global.traceability:origin.file_path": filepath,
        }
    )
    if current is None:
        raise HTTPException(status_code=404, detail="Metadata not found")
    else:
        id = current["_id"]
        version = current["global"]["traceability:revision"]
        # This is going to be a race condition
        version_number = version + 1
        metadata.globalMetadata.traceability_revision = version_number
        metadata.globalMetadata.traceability_origin = current["global"][
            "traceability:origin"
        ]
        # audit document
        audit_document = {
            "metadata": metadata.dict(by_alias=True, exclude_unset=True, exclude_none=True),
            "user": current_user["preferred_username"],
            "action": "update"
        }
        try:
            await versions.insert_one(audit_document)
        except Exception as e:
            print(f"Error inserting audit document: {e}")

        await metadatas.update_one(
            {"_id": id},
            {
                "$set": metadata.dict(
                    by_alias=True, exclude_unset=True, exclude_none=True
                )
            },
        )
        return
