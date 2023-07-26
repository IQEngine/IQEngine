from datetime import datetime
from typing import Any, Dict, List, Optional

from blob.azure_client import AzureBlobClient
from database import datasource_repo, metadata_repo
from database.models import DataSource, DataSourceReference, Metadata, TrackMetadata
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from helpers.authorization import required_roles
from helpers.cipher import decrypt
from helpers.urlmapping import ApiType, get_content_type, get_file_name
from motor.core import AgnosticCollection

router = APIRouter()


@router.get(
    "/api/datasources/{account}/{container}/meta",
    status_code=200,
    response_model=list[Metadata],
)
async def get_all_meta(
    account,
    container,
    metadatas: AgnosticCollection = Depends(metadata_repo.collection),
    current_user: Optional[dict] = Depends(required_roles()),
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
    metadatas: AgnosticCollection = Depends(metadata_repo.collection),
    current_user: Optional[dict] = Depends(required_roles()),
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
    async for datum in metadata:
        result.append(datum["global"]["traceability:origin"]["file_path"])
    return result


@router.get(
    "/api/datasources/{account}/{container}/{filepath:path}/meta",
    response_model=Metadata,
)
async def get_meta(
    metadata: Metadata = Depends(metadata_repo.get),
    current_user: Optional[dict] = Depends(required_roles()),
):
    if not metadata:
        raise HTTPException(status_code=404, detail="Metadata not found")
    return metadata


@router.get(
    "/api/datasources/{account}/{container}/{filepath:path}/track",
    response_model=TrackMetadata,
)
async def get_track_meta(
    metadata: Metadata = Depends(metadata_repo.get),
    current_user: Optional[dict] = Depends(required_roles()),
):
    if not metadata:
        raise HTTPException(status_code=404, detail="Metadata not found")

    return TrackMetadata(
        iqengine_geotrack=metadata.globalMetadata.__dict__.get("iqengine:geotrack"),
        description=metadata.globalMetadata.core_description,
        account=metadata.globalMetadata.traceability_origin.account,
        container=metadata.globalMetadata.traceability_origin.container,
    )


@router.get(
    "/api/datasources/{account}/{container}/{filepath:path}.jpg",
    response_class=StreamingResponse,
)
async def get_meta_thumbnail(
    filepath: str,
    background_tasks: BackgroundTasks,
    datasource: DataSource = Depends(datasource_repo.get),
    azure_client: AzureBlobClient = Depends(AzureBlobClient),
    current_user: Optional[dict] = Depends(required_roles()),
):
    if not datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")

    sas_token = datasource.sasToken.get_secret_value() if datasource.sasToken else None
    if sas_token is not None:
        azure_client.set_sas_token(decrypt(sas_token))

    thumbnail_path = get_file_name(filepath, ApiType.THUMB)
    content_type = get_content_type(ApiType.THUMB)
    if not await azure_client.blob_exist(thumbnail_path):
        metadata = await metadata_repo.get(
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


async def process_geolocation(target: str, geolocation: str):
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
        raise HTTPException(
            status_code=400,
            detail="Invalid geolocation format, expected: long, lat, radius",
        )


@router.get(
    "/api/datasources/query",
    status_code=200,
    response_model=list[DataSourceReference],
)
async def query_meta(
    account: Optional[List[str]] = Query([]),
    container: Optional[List[str]] = Query([]),
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
    metadataSet: AgnosticCollection = Depends(metadata_repo.collection),
    current_user: Optional[dict] = Depends(required_roles()),
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
    # global description
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
        query_condition.update(await process_geolocation("captures", captures_geo))
    if annotations_geo:
        query_condition.update(
            await process_geolocation("annotations", annotations_geo)
        )

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

    metadata = metadataSet.find(
        query_condition,
        {
            "global.traceability:origin.type": 1,
            "global.traceability:origin.account": 1,
            "global.traceability:origin.container": 1,
            "global.traceability:origin.file_path": 1,
            "_id": 0,
        },
    )

    result = []
    async for datum in metadata:
        traceability_origin = datum.get("global", {}).get("traceability:origin", {})
        ds_reference = DataSourceReference(
            type=traceability_origin.get("type"),
            account=traceability_origin.get("account"),
            container=traceability_origin.get("container"),
            file_path=traceability_origin.get("file_path"),
        )
        result.append(ds_reference)
    return result


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
    datasources: AgnosticCollection = Depends(datasource_repo.collection),
    metadatas: AgnosticCollection = Depends(metadata_repo.collection),
    versions: AgnosticCollection = Depends(metadata_repo.versions_collection),
    current_user: Optional[dict] = Depends(required_roles()),
):
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
    await versions.insert_one(
        metadata.dict(by_alias=True, exclude_unset=True, exclude_none=True)
    )
    return metadata


@router.put(
    "/api/datasources/{account}/{container}/{filepath:path}/meta", status_code=204
)
async def update_meta(
    account,
    container,
    filepath,
    metadata: Metadata,
    metadatas: AgnosticCollection = Depends(metadata_repo.collection),
    versions: AgnosticCollection = Depends(metadata_repo.versions_collection),
    current_user: Optional[dict] = Depends(required_roles()),
):
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
        await versions.insert_one(
            metadata.dict(by_alias=True, exclude_unset=True, exclude_none=True)
        )
        await metadatas.update_one(
            {"_id": id},
            {
                "$set": metadata.dict(
                    by_alias=True, exclude_unset=True, exclude_none=True
                )
            },
        )
        return
