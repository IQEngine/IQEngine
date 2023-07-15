from database.database import db
from database.models import Metadata
from motor.core import AgnosticCollection


def collection() -> AgnosticCollection:
    collection: AgnosticCollection = db().metadata
    return collection


def versions_collection() -> AgnosticCollection:
    collection: AgnosticCollection = db().versions
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
