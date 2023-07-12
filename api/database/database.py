import os
import asyncio
import pymongo_inmemory
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection
from database.models import Metadata

_db = None


def create_db_client():
    global _db
    connection_string = os.getenv("IQENGINE_METADATA_DB_CONNECTION_STRING")
    loop = asyncio.new_event_loop()
    _db = AsyncIOMotorClient(connection_string,io_loop=loop)["IQEngine"]
    return _db


def create_in_memory_db_client():
    global _db, in_memory_db
    in_memory_db = pymongo_inmemory.MongoClient('localhost',27017)["IQEngine"]
    loop = asyncio.new_event_loop()
    _db = AsyncIOMotorClient('localhost',27017, io_loop=loop)["IQEngine"]
    return _db


def db():
    global _db
    if _db is None:
        if "IN_MEMORY_DB" in os.environ and os.environ["IN_MEMORY_DB"] != str("0"):
            _db = create_in_memory_db_client()
        else:
            _db = create_db_client()
    return _db


def plugins_collection():
    collection:  AsyncIOMotorCollection = db().plugins
    return collection
