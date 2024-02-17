import json
from typing import List, Dict, Any, Optional
from datetime import datetime

from fastapi import Depends
from helpers.datasource_access import check_access

from .models import Metadata, DataSourceReference
from motor.core import AgnosticCollection


def collection() -> AgnosticCollection:
    from .database import db
    collection: AgnosticCollection = db().metadata
    return collection


def versions_collection() -> AgnosticCollection:
    from .database import db
    collection: AgnosticCollection = db().versions
    return collection


async def get_metadata(account, container, filepath, access_allowed=Depends(check_access)) -> Metadata | None:
    """
    Get a metadata by account, container and filepath

    Parameters
    ----------
    account : str
        The account name.
    container : str
        The container name.
    filepath : str
        The filepath

    Returns
    -------
    Metadata
        The Sigmf metadata.
    """
    if access_allowed is None:
        return None

    metadata_collection: AgnosticCollection = collection()
    metadata = await metadata_collection.find_one(
        {
            "global.traceability:origin.account": account,
            "global.traceability:origin.container": container,
            "global.traceability:origin.file_path": filepath,
        }
    )
    if not metadata:
        return None
    return Metadata(**metadata) # inherited from pydantic BaseModel


async def create(metadata: Metadata, user: str):
    """
    Create or updates a metadata. The metadata will be henceforth identified by account/container/filepath which
    must be unique or this function will throw an exception.

    This function will also create a new version of the metadata in the versions collection.

    Parameters
    ----------
    metadata : Metadata
        The metadata to create.

    Returns
    -------
    None
    """
    if Depends(check_access) is None:
        return False
    
    if metadata.globalMetadata.traceability_origin is None:
        raise Exception("Metadata must have origin")

    metadata_collection: AgnosticCollection = collection()

    account = metadata.globalMetadata.traceability_origin.account
    container = metadata.globalMetadata.traceability_origin.container
    filepath = metadata.globalMetadata.traceability_origin.file_path
    filter = {
            "global.traceability:origin.account": account,
            "global.traceability:origin.container": container,
            "global.traceability:origin.file_path": filepath,
        } # {"_id": 1},

    # Either creates or updates based on whether it exists
    await metadata_collection.replace_one(filter=filter, replacement=metadata.dict(by_alias=True, exclude_unset=True, exclude_none=True), upsert=True)

    # audit document
    audit_document = {
        "metadata": metadata.dict(by_alias=True, exclude_unset=True, exclude_none=True),
        "user": user,
        "action": "create",
    }

    versions: AgnosticCollection = versions_collection()
    await versions.insert_one(audit_document)


class InvalidGeolocationFormat(Exception):
    def __init__(self, message="Invalid geolocation format, expected: long, lat, radius"):
        self.message = message
        super().__init__(self.message)


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
        raise InvalidGeolocationFormat()


async def query_metadata(
    account: Optional[List[str]] = [],
    container: Optional[List[str]] = [],
    database_id: Optional[List[str]] = [],
    min_frequency: Optional[float] = None,
    max_frequency: Optional[float] = None,
    author: Optional[str] = None,
    description: Optional[str] = None,
    label: Optional[str] = None,
    comment: Optional[str] = None,
    captures_geo: Optional[str] = None,
    annotations_geo: Optional[str] = None,
    min_datetime: Optional[datetime] = None,
    max_datetime: Optional[datetime] = None,
    text: Optional[str] = None,
    captures_geo_json: Optional[str] = None,
    captures_radius: Optional[float] = None,
    annotations_geo_json: Optional[str] = None,
    annotations_radius: Optional[float] = None,
) -> List[DataSourceReference]:
    """
    This function is responsible for querying metadata from the specified MongoDB collection based on various
    query parameters. It performs a database search using the provided criteria and returns a list of
    dictionaries containing relevant metadata information.

    Parameters:
    - metadataSet (Motor.core.AgnosticCollection): The MongoDB collection where the metadata is stored.
    - account (Optional[List[str]]): A list of account names to filter the metadata by.
    - container (Optional[List[str]]): A list of container names to filter the metadata by.
    - database_id (Optional[List[str]]): A list of database IDs ({account}/{container}), where each entry is a
    combination of an account and a container, to filter the metadata by.
    - min_frequency (Optional[float]): The minimum frequency value to filter the metadata by.
    - max_frequency (Optional[float]): The maximum frequency value to filter the metadata by.
    - author (Optional[str]): The author's name to filter the metadata by.
    - description (Optional[str]): A keyword to search for in the global description field to filter the metadata by.
    - label (Optional[str]): A keyword to search for in the annotations' labels to filter the metadata by.
    - comment (Optional[str]): A keyword to search for in the annotations' descriptions to filter the metadata by.
    - captures_geo (Optional[str]): Geolocation information to filter the metadata by in the "captures" section.
    - annotations_geo (Optional[str]): Geolocation information to filter the metadata by in the "annotations" section.
    - min_datetime (Optional[datetime]): The minimum datetime value to filter the metadata by.
    - max_datetime (Optional[datetime]): The maximum datetime value to filter the metadata by.
    - text (Optional[str]): A keyword to search for in various description fields to filter the metadata by.

    Returns:
    - A list of dictionaries, each containing the metadata information for a specific data source.
        The dictionaries contain the following keys:
        - "type": The type of data source (e.g., "file", "stream").
        - "account": The account associated with the data source.
        - "container": The container associated with the data source.
        - "file_path": The file path of the data source.

    Usage:
    metadata = await query_metadata(
        metadataSet=collection,
        account=["account1", "account2"],
        min_frequency=10.0,
        author="John Doe",
        captures_geo="-175.8,4.4,500000",
        text="important data",
    )
    This example queries the metadata with specified filter criteria and returns a list of data source
    references that match the search.
    """
    metadataSet: AgnosticCollection = collection()
    query_condition: Dict[str, Any] = {}
    if database_id:
        database_id_conditions = []
        for entry in database_id:
            account_part, container_part = entry.split("/")
            database_id_conditions.append(
                {
                    "$and": [
                        {
                            "global.traceability:origin.account": {
                                "$regex": account_part,
                                "$options": "i",
                            }
                        },
                        {
                            "global.traceability:origin.container": {
                                "$regex": container_part,
                                "$options": "i",
                            }
                        },
                    ]
                }
            )
        query_condition.update({"$or": database_id_conditions})
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
    if captures_geo_json:
        query_condition.update(
            {
                "captures.core:geolocation": {
                    "$near": {
                        "$geometry": json.loads(captures_geo_json),
                        "$maxDistance": captures_radius or 0,
                    }
                }
            }
        )
    if annotations_geo_json:
        query_condition.update(
            {
                "annotations.core:geolocation": {
                    "$near": {
                        "$geometry": json.loads(annotations_geo_json),
                        "$maxDistance": annotations_radius or 0,
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
