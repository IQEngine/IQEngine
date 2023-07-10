from database.database import db
from database.models import Metadata
from pymongo.collection import Collection


def collection():
    collection: Collection[Metadata] = db().metadata
    return collection


def versions_collection():
    collection: Collection[Metadata] = db().versions
    return collection


def get(account, container, filepath) -> Metadata:
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
    metadata = collection().find_one(
        {
            "global.traceability:origin.account": account,
            "global.traceability:origin.container": container,
            "global.traceability:origin.file_path": filepath,
        }
    )
    if not metadata:
        return None
    return Metadata(**metadata)
