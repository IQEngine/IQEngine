import database.database
from database.models import DataSource, DataSourceReference, Metadata
from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Collection

router = APIRouter()


@router.get(
    "/api/datasources/{accountName}/{containerName}/meta",
    status_code=200,
    response_model=list[Metadata],
)
def get_all_meta(
    accountName,
    containerName,
    metadatas: Collection[Metadata] = Depends(database.database.metadata_collection),
):
    # TODO: Should we validate datasource_id?

    # Return all metadata for this datasource, could be an empty
    # list
    metadata = metadatas.find(
        {
            "global.rfdx:source.accountName": accountName,
            "global.rfdx:source.containerName": containerName,
        }
    )
    result = []
    for datum in metadata:
        result.append(datum)
    return result


@router.get(
    "/api/datasources/{accountName}/{containerName}/{filepath:path}/meta",
    response_model=Metadata,
)
def get_meta(
    accountName,
    containerName,
    filepath,
    metadatas: Collection[Metadata] = Depends(database.database.metadata_collection),
):
    metadata = metadatas.find_one(
        {
            "global.rfdx:source.accountName": accountName,
            "global.rfdx:source.containerName": containerName,
            "global.rfdx:source.filepath": filepath,
        }
    )
    if not metadata:
        raise HTTPException(status_code=404, detail="Metadata not found")
    return metadata


@router.post(
    "/api/datasources/{accountName}/{containerName}/{filepath:path}/meta",
    status_code=201,
    response_model=Metadata,
)
def create_meta(
    accountName: str,
    containerName: str,
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
    datasource = datasources.find_one(
        {"accountName": accountName, "containerName": containerName}
    )
    if not datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")

    # Check metadata doesn't already exist
    if metadatas.find_one(
        {
            "global.rfdx:source.accountName": accountName,
            "global.rfdx:source.containerName": containerName,
            "global.rfdx:source.filepath": filepath,
        }
    ):
        raise HTTPException(status_code=409, detail="Metadata already exists")

    # Create the first metadata record
    metadata.globalMetadata.rfdx_source = DataSourceReference(
        accountName,
        containerName,
        filepath,
    )
    metadata.globalMetadata.rfdx_version = 0
    metadatas.insert_one(
        metadata.dict(by_alias=True, exclude_unset=True, exclude_none=True)
    )
    versions.insert_one(
        metadata.dict(by_alias=True, exclude_unset=True, exclude_none=True)
    )
    return metadata


@router.put(
    "/api/datasources/{accountName}/{containerName}/{filepath:path}/meta",
    status_code=204,
)
def update_meta(
    accountName,
    containerName,
    filepath,
    metadata: Metadata,
    metadatas: Collection[Metadata] = Depends(database.database.metadata_collection),
    versions: Collection[Metadata] = Depends(
        database.database.metadata_versions_collection
    ),
):
    current = metadatas.find_one(
        {
            "global.rfdx:source.accountName": accountName,
            "global.rfdx:source.containerName": containerName,
            "global.rfdx:source.filepath": filepath,
        }
    )
    if current is None:
        raise HTTPException(status_code=404, detail="Metadata not found")
    else:
        id = current["_id"]
        version = current["global"]["rfdx:version"]
        # This is going to be a race condition
        version_number = version + 1
        metadata.globalMetadata.rfdx_version = version_number
        metadata.globalMetadata.rfdx_source = current["global"]["rfdx:source"]
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
