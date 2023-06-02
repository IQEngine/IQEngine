import os

import pymongo
import pymongo_inmemory
from database.models import DataSource, Metadata
from pymongo.collection import Collection

_db = None


def create_db_client():
    global _db
    connection_string = os.getenv("METADATA_DB_CONNECTION_STRING")
    _db = pymongo.MongoClient(connection_string)["RFDX"]
    return _db


def create_in_memory_db_client():
    global _db
    _db = pymongo_inmemory.MongoClient()["RFDX"]
    return _db


def db():
    global _db
    if _db is None:
        if "RFDX_FF_INMEMDB" in os.environ and os.environ["RFDX_FF_INMEMDB"] != str(
            "0"
        ):
            _db = create_in_memory_db_client()
        else:
            _db = create_db_client()
    return _db


def datasources_collection():
    collection: Collection[DataSource] = db().datasources
    return collection


def metadata_collection():
    collection: Collection[Metadata] = db().metadatas
    return collection


def metadata_versions_collection():
    collection: Collection[Metadata] = db().versions
    return collection
