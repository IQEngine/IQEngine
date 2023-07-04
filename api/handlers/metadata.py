from datetime import datetime
from typing import Any, Dict, List, Optional

import database.database
import httpx
from database.models import DataSource, DataSourceReference, Metadata
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pymongo.collection import Collection

from .urlmapping import add_URL_sasToken, apiType

router = APIRouter()


@router.get(
    "/api/datasources/{account}/{container}/meta",
    status_code=200,
    response_model=list[Metadata],
)
def get_all_meta(
    account,
    container,
    metadatas: Collection[Metadata] = Depends(database.database.metadata_collection),
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
    "/api/datasources/{account}/{container}/{filepath:path}/meta",
    response_model=Metadata,
)
def get_meta(
    account,
    container,
    filepath,
    metadatas: Collection[Metadata] = Depends(database.database.metadata_collection),
):
    metadata = metadatas.find_one(
        {
            "global.traceability:origin.account": account,
            "global.traceability:origin.container": container,
            "global.traceability:origin.file_path": filepath,
        }
    )
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

    if not datasource.get("sasToken"):
        datasource["sasToken"] = ""  # set to empty str if null

    imageURL = add_URL_sasToken(
        account, container, datasource["sasToken"], filepath, apiType.IQDATA
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
    account,
    container,
    filepath,
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

    if not datasource.get("sasToken"):
        datasource["sasToken"] = ""  # set to empty str if null

    imageURL = add_URL_sasToken(
        account, container, datasource["sasToken"], filepath, apiType.THUMB
    )

    async with httpx.AsyncClient() as client:
        response = await client.get(imageURL.get_secret_value())
    if response.status_code != 200:
        raise HTTPException(status_code=404, detail="File not found")

    return StreamingResponse(
        response.iter_bytes(), media_type=response.headers["Content-Type"]
    )


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
    geo_lat: Optional[float] = Query(None),
    geo_long: Optional[float] = Query(None),
    geo_radius: Optional[float] = Query(None),
    metadataSet: Collection[Metadata] = Depends(database.database.metadata_collection),
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

    if geo_lat is not None and geo_long is not None and geo_radius is not None:
        query_condition.update(
            {
                "global.core:geolocation": {
                    "$near": {
                        "$geometry": {
                            "type": "Point",
                            "coordinates": [geo_long, geo_lat],
                        },
                        "$maxDistance": geo_radius,
                    }
                }
            }
        )

    if text is not None:
        or_condition = [
            {"global.core:description": {"$regex": text, "$options": "i"}},
            {"annotations.core:label": {"$regex": text, "$options": "i"}},
            {"annotations.core:description": {"$regex": text, "$options": "i"}},
        ]
        query_condition.update({"$or": or_condition})

    if min_datetime is not None:
        min_datetime_formatted = min_datetime.strftime("%Y-%m-%dT%H:%M:%S")
        query_condition.update(
            {"captures.core:datetime": {"$gte": min_datetime_formatted}}
        )
    if max_datetime is not None:
        max_datetime_formatted = max_datetime.strftime("%Y-%m-%dT%H:%M:%S")
        query_condition.update(
            {"captures.core:datetime": {"$lte": max_datetime_formatted}}
        )

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
    datasources: Collection[DataSource] = Depends(
        database.database.datasources_collection
    ),
    metadatas: Collection[Metadata] = Depends(database.database.metadata_collection),
    versions: Collection[Metadata] = Depends(
        database.database.metadata_versions_collection
    ),
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
    metadatas: Collection[Metadata] = Depends(database.database.metadata_collection),
    versions: Collection[Metadata] = Depends(
        database.database.metadata_versions_collection
    ),
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
