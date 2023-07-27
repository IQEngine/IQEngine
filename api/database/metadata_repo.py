from database.database import db
from database.models import Metadata
from motor.core import AgnosticCollection


def collection() -> AgnosticCollection:
    collection: AgnosticCollection = db().metadata
    return collection


def versions_collection() -> AgnosticCollection:
    collection: AgnosticCollection = db().versions
    return collection


async def get(account, container, filepath) -> Metadata | None:
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
    return Metadata(**metadata)


async def exists(account, container, filepath) -> bool:
    """
    Check if a metadata exists by account, container and filepath

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
    bool
        True if the metadata exists, False otherwise.
    """
    metadata_collection: AgnosticCollection = collection()
    metadata = await metadata_collection.find_one(
        {
            "global.traceability:origin.account": account,
            "global.traceability:origin.container": container,
            "global.traceability:origin.file_path": filepath,
        },
        {"_id": 1},
    )
    return metadata is not None


async def create(metadata: Metadata):
    """
    Create a new metadata. The metadata will be henceforth identified by account/container/filepath which
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
    if await exists(
        metadata.globalMetadata.traceability_origin.account,
        metadata.globalMetadata.traceability_origin.container,
        metadata.globalMetadata.traceability_origin.file_path):
        raise Exception("Metadata Already Exists")

    metadata_collection: AgnosticCollection = collection()
    versions: AgnosticCollection = versions_collection()

    await metadata_collection.insert_one(
        metadata.dict(by_alias=True, exclude_unset=True)
    )
    await versions.insert_one(metadata.dict(by_alias=True, exclude_unset=True))
