import os
import pymongo
import pymongo_inmemory

_db = None

def create_db_client():
    global _db
    connection_string = os.getenv('METADATA_DB_CONNECTION_STRING')
    _db = pymongo.MongoClient(connection_string)["RFDX"]
    return _db

def create_in_memory_db_client():
    global _db
    _db = pymongo_inmemory.MongoClient()["RFDX"]
    return _db

def db():
    global _db
    if _db == None:
        _db = create_in_memory_db_client()
    return _db

