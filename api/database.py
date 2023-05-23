import os
import pymongo

_db = None

def db():
    return _db

def create_db_client():
    global _db
    connection_string = os.getenv('METADATA_DB_CONNECTION_STRING')
    _db = pymongo.MongoClient(connection_string)["RFDX"]
    return _db

def create_in_memory_db_client():
    import pymongo_inmemory
    global _db
    _db = pymongo_inmemory.MongoClient()["RFDX"]
    return _db