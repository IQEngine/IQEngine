from database.database import db
from database.models import Metadata
from motor.motor_asyncio import AsyncIOMotorCollection


def collection():
    collection: AsyncIOMotorCollection = db().metadata
    return collection


def versions_collection():
    collection: AsyncIOMotorCollection = db().versions
    return collection


async def get(account, container, filepath) -> Metadata:
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
    metadata_collection: AsyncIOMotorCollection = collection()
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
