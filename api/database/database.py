import os

import pymongo_inmemory
from motor.motor_asyncio import AsyncIOMotorClient
from motor.core import AgnosticDatabase

_db: AgnosticDatabase = None
in_memory_db: pymongo_inmemory.MongoClient = None


def create_db_client() -> AgnosticDatabase:
    global _db
    connection_string = os.getenv("IQENGINE_METADATA_DB_CONNECTION_STRING")
    _db = AsyncIOMotorClient(connection_string)["IQEngine"]
    return _db


def create_in_memory_db_client() -> AgnosticDatabase:
    global _db, in_memory_db
    in_memory_db = pymongo_inmemory.MongoClient()["IQEngine"]
    _db = AsyncIOMotorClient()["IQEngine"]
    return _db


def db() -> AgnosticDatabase:
    global _db
    if _db is None:
        if "IN_MEMORY_DB" in os.environ and os.environ["IN_MEMORY_DB"] != str("0"):
            _db = create_in_memory_db_client()
        else:
            _db = create_db_client()
    return _db


async def reset_db():
    global _db
    if _db is None:
        return
    if "IN_MEMORY_DB" in os.environ and os.environ["IN_MEMORY_DB"] != str("0"):
        await _db.client.drop_database("IQEngine")
    _db.client.close()
    _db = None
