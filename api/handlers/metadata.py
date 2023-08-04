from datetime import datetime
from typing import List, Optional
from blob.azure_client import AzureBlobClient
from helpers.datasource_access import check_access
from database import datasource_repo, metadata_repo
from database.metadata_repo import InvalidGeolocationFormat, query_metadata

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
    access_allowed=Depends(check_access),
):

    if access_allowed is None:
        return []

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
    metadata_source: AgnosticCollection = Depends(metadata_repo.collection),
    current_user: Optional[dict] = Depends(required_roles()),
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
    if not metadata or not metadata.globalMetadata.traceability_origin.account or not metadata.globalMetadata.traceability_origin.container:
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
    current_user: Optional[dict] = Depends(required_roles()),
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
        for item in result:
            if check_access(item.account, item.container, current_user) is None:
                result.remove(item)
        return result

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
    datasources: AgnosticCollection = Depends(datasource_repo.collection),
    metadatas: AgnosticCollection = Depends(metadata_repo.collection),
    versions: AgnosticCollection = Depends(metadata_repo.versions_collection),
    current_user: Optional[dict] = Depends(required_roles()),
    access_allowed=Depends(check_access)
):
    if access_allowed!="owner":
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
    access_allowed=Depends(check_access),
):
    if access_allowed!="owner":
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
