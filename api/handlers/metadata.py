from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx
from blob.azure_client import AzureBlobClient
from database import datasource_repo, metadata_repo
from database.models import DataSource, DataSourceReference, Metadata
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from helpers.cipher import decrypt
from helpers.urlmapping import (
    ApiType,
    add_URL_sasToken,
    get_content_type,
    get_file_name,
)
from pydantic import SecretStr
from pymongo.collection import Collection

router = APIRouter()


@router.get(
    "/api/datasources/{account}/{container}/meta",
    status_code=200,
    response_model=list[Metadata],
)
def get_all_meta(
    account,
    container,
    metadatas: Collection[Metadata] = Depends(metadata_repo.collection),
):
    # TODO: Should we validate datasource_id?

    # Return all metadata for this datasource, could be an empty
    # list
    metadata = metadatas.find(
        {
            "global.traceability:origin.account": account,
            "global.traceability:origin.container": container,
        }
    )
    result = []
    for datum in metadata:
        result.append(datum)
    return result


@router.get(
    "/api/datasources/{account}/{container}/meta/paths",
    status_code=200,
    response_model=list[str],
)
def get_all_meta_name(
    account,
    container,
    metadatas: Collection[Metadata] = Depends(metadata_repo.collection),
):
    metadata = metadatas.find(
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
    for datum in metadata:
        result.append(datum["global"]["traceability:origin"]["file_path"])
    return result


@router.get(
    "/api/datasources/{account}/{container}/{filepath:path}/meta",
    response_model=Metadata,
)
def get_meta(
    metadata: Metadata = Depends(metadata_repo.get),
):
    if not metadata:
        raise HTTPException(status_code=404, detail="Metadata not found")
    return metadata


@router.get(
    "/api/datasources/{account}/{container}/{filepath:path}/iqdata",
    response_class=StreamingResponse,
)
async def get_metadata_iqdata(
    account: str,
    container: str,
    filepath: str,
    datasource: DataSource = Depends(datasource_repo.get),
):
    # Create the imageURL with sasToken
    if not datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")

    if not datasource.sasToken:
        datasource.sasToken = SecretStr("")  # set to empty str if null

    imageURL = add_URL_sasToken(
        account,
        container,
        datasource.sasToken.get_secret_value(),
        filepath,
        ApiType.IQDATA,
    )

    async with httpx.AsyncClient() as client:
        response = await client.get(imageURL.get_secret_value())
    if response.status_code != 200:
        raise HTTPException(status_code=404, detail="File not found")

    return StreamingResponse(
        response.iter_bytes(), media_type=response.headers["Content-Type"]
    )


@router.get(
    "/api/datasources/{account}/{container}/{filepath:path}/thumbnail",
    response_class=StreamingResponse,
)
async def get_meta_thumbnail(
    filepath: str,
    background_tasks: BackgroundTasks,
    datasource: DataSource = Depends(datasource_repo.get),
    azure_client: AzureBlobClient = Depends(AzureBlobClient),
):
    if not datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")

    azure_client.set_sas_token(decrypt(datasource.sasToken.get_secret_value()))
    thumbnail_path = get_file_name(filepath, ApiType.THUMB)
    content_type = get_content_type(ApiType.THUMB)
    if not azure_client.blob_exist(thumbnail_path):
        metadata = metadata_repo.get(
            datasource.account,
            datasource.container,
            filepath,
        )
        if not metadata:
            raise HTTPException(status_code=404, detail="Metadata not found")
        datatype = metadata.globalMetadata.core_datatype
        image = azure_client.get_new_thumbnail(data_type=datatype, filepath=filepath)
        # Upload the thumbnail in the background
        background_tasks.add_task(
            azure_client.upload_blob, filepath=thumbnail_path, data=image
        )
        return Response(content=image, media_type=content_type)

    return Response(
        content=azure_client.get_blob_content(thumbnail_path), media_type=content_type
    )


def process_geolocation(target: str, geolocation: str):
    try:
        geo_long_str, geo_lat_str, geo_radius_str = geolocation.split(",")
        geo_long = float(geo_long_str)
        geo_lat = float(geo_lat_str)
        geo_radius = float(geo_radius_str)
        target_field = ""
        if target == "captures":
            target_field = "captures.core:geolocation"
        if target == "annotations":
            target_field = "annotations.core:geolocation"

        return {
                target_field: {
                    "$near": {
                        "$geometry": {
                            "type": "Point",
                            "coordinates": [geo_long, geo_lat],
                        },
                        "$maxDistance": geo_radius,
                    }
                }
            }

    except Exception:
        raise HTTPException(status_code=400, detail="Invalid geolocation format, expected: long, lat, radius")


@router.get(
    "/api/datasources/query",
    status_code=200,
    response_model=list[Metadata],
)
def query_meta(
    account: Optional[List[str]] = Query([]),
    container: Optional[List[str]] = Query([]),
    min_frequency: Optional[float] = Query(None),
    max_frequency: Optional[float] = Query(None),
    author: Optional[str] = Query(None),
    label: Optional[str] = Query(None),
    comment: Optional[str] = Query(None),
    description: Optional[str] = Query(None),
    min_datetime: Optional[datetime] = Query(None),
    max_datetime: Optional[datetime] = Query(None),
    text: Optional[str] = Query(None),
    captures_geo: Optional[str] = Query(None),
    annotations_geo: Optional[str] = Query(None),
    metadataSet: Collection[Metadata] = Depends(metadata_repo.collection),
):
    query_condition: Dict[str, Any] = {}
    if account:
        query_condition.update(
            {
                "$or": [
                    {
                        "global.traceability:origin.account": {
                            "$regex": a,
                            "$options": "i",
                        }
                    }
                    for a in account
                ]
            }
        )
    if container:
        query_condition.update(
            {
                "$or": [
                    {
                        "global.traceability:origin.container": {
                            "$regex": c,
                            "$options": "i",
                        }
                    }
                    for c in container
                ]
            }
        )
    if min_frequency is not None:
        query_condition.update({"captures.core:frequency": {"$gte": min_frequency}})
    if max_frequency is not None:
        query_condition.update({"captures.core:frequency": {"$lte": max_frequency}})
    if author is not None:
        query_condition.update(
            {"global.core:author": {"$regex": author, "$options": "i"}}
        )
    if description is not None:
        query_condition.update(
            {"global.core:description": {"$regex": description, "$options": "i"}}
        )
    if label is not None:
        query_condition.update(
            {"annotations.core:label": {"$regex": label, "$options": "i"}}
        )
    if comment is not None:
        query_condition.update(
            {"annotations.core:description": {"$regex": comment, "$options": "i"}}
        )

    if captures_geo:
        query_condition.update(process_geolocation("captures", captures_geo))
    if annotations_geo:
        query_condition.update(process_geolocation("annotations", annotations_geo))

    if text is not None:
        or_condition = [
            {"global.core:description": {"$regex": text, "$options": "i"}},
            {"annotations.core:label": {"$regex": text, "$options": "i"}},
            {"annotations.core:description": {"$regex": text, "$options": "i"}},
        ]
        query_condition.update({"$or": or_condition})

    if min_datetime is not None or max_datetime is not None:
        datetime_query = {}
        if min_datetime is not None:
            min_datetime_formatted = min_datetime.strftime("%Y-%m-%dT%H:%M:%S")
            datetime_query.update({"$gte": min_datetime_formatted})
        if max_datetime is not None:
            max_datetime_formatted = max_datetime.strftime("%Y-%m-%dT%H:%M:%S")
            datetime_query.update({"$lte": max_datetime_formatted})
        query_condition.update({"captures.core:datetime": datetime_query})

    metadata = metadataSet.find(query_condition)

    result = []
    for datum in metadata:
        result.append(datum)
    return result


@router.post(
    "/api/datasources/{account}/{container}/{filepath:path}/meta",
    status_code=201,
    response_model=Metadata,
)
def create_meta(
    account: str,
    container: str,
    filepath: str,
    metadata: Metadata,
    datasources: Collection[DataSource] = Depends(datasource_repo.collection),
    metadatas: Collection[Metadata] = Depends(metadata_repo.collection),
    versions: Collection[Metadata] = Depends(metadata_repo.versions_collection),
):
    # Check datasource id is valid
    datasource = datasources.find_one({"account": account, "container": container})
    if not datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")

    # Check metadata doesn't already exist
    if metadatas.find_one(
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
    metadatas.insert_one(
        metadata.dict(by_alias=True, exclude_unset=True, exclude_none=True)
    )
    versions.insert_one(
        metadata.dict(by_alias=True, exclude_unset=True, exclude_none=True)
    )
    return metadata


@router.put(
    "/api/datasources/{account}/{container}/{filepath:path}/meta",
    status_code=204,
)
def update_meta(
    account,
    container,
    filepath,
    metadata: Metadata,
    metadatas: Collection[Metadata] = Depends(metadata_repo.collection),
    versions: Collection[Metadata] = Depends(metadata_repo.versions_collection),
):
    current = metadatas.find_one(
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
        versions.insert_one(
            metadata.dict(by_alias=True, exclude_unset=True, exclude_none=True)
        )
        metadatas.update_one(
            {"_id": id},
            {
                "$set": metadata.dict(
                    by_alias=True, exclude_unset=True, exclude_none=True
                )
            },
        )
        return
