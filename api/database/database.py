import os

import pymongo_inmemory
from motor.motor_asyncio import AsyncIOMotorClient

_db = None


def create_db_client():
    global _db
    connection_string = os.getenv("IQENGINE_METADATA_DB_CONNECTION_STRING")
    _db = AsyncIOMotorClient(connection_string)["IQEngine"]
    return _db


def create_in_memory_db_client():
    global _db, in_memory_db
    in_memory_db = pymongo_inmemory.MongoClient("localhost", 27017)["IQEngine"]
    _db = AsyncIOMotorClient("localhost", 27017)["IQEngine"]
    return _db


def db():
    global _db
    if _db is None:
        if "IN_MEMORY_DB" in os.environ and os.environ["IN_MEMORY_DB"] != str("0"):
            _db = create_in_memory_db_client()
        else:
            _db = create_db_client()
    return _db
