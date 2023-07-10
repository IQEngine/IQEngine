import os

import pymongo
import pymongo_inmemory
from database.models import DataSource, Metadata
from pymongo.collection import Collection

_db = None


def create_db_client():
    global _db
    connection_string = os.getenv("IQENGINE_METADATA_DB_CONNECTION_STRING")
    _db = pymongo.MongoClient(connection_string)["IQEngine"]
    return _db


def create_in_memory_db_client():
    global _db
    _db = pymongo_inmemory.MongoClient()["IQEngine"]
    return _db


def db():
    global _db
    if _db is None:
        if "IN_MEMORY_DB" in os.environ and os.environ["IN_MEMORY_DB"] != str("0"):
            _db = create_in_memory_db_client()
        else:
            _db = create_db_client()
    return _db


def datasources_collection():
    collection: Collection[DataSource] = db().datasources
    return collection


def metadata_collection():
    collection: Collection[Metadata] = db().metadata
    return collection


def metadata_versions_collection():
    collection: Collection[Metadata] = db().versions
    return collection


def plugins_collection():
    collection: Collection[Metadata] = db().plugins
    return collection


def get_datasource(account, container) -> DataSource:
    """
    Get a datasource by account and container

    Parameters
    ----------
    account : str
        The account name.
    container : str
        The container name.

    Returns
    -------
    DataSource
        The datasource.
    """

    datasource = datasources_collection().find_one(
        {"account": account, "container": container}
    )
    if datasource is None:
        return None
    return DataSource(**datasource)


def get_metadata(account, container, filepath) -> Metadata:
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
    metadata = metadata_collection().find_one(
        {
            "global.traceability:origin.account": account,
            "global.traceability:origin.container": container,
            "global.traceability:origin.file_path": filepath,
        }
    )
    if metadata is None:
        return None
    return Metadata(**metadata)
