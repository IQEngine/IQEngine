import os
from fastapi import FastAPI, Request
from pymongo import MongoClient

connection_string = os.getenv('COSMOS_DB_CONNECTION_STRING')

client = MongoClient(connection_string)
db = client.RFDX 
metadata = db['current']
metadata_versions = db['versions']

from .database import create_db_client
from .datasources import router as datasources_router
from .metadata import router as metadata_router
from .status import router as status_router

def create_app(db_client = None):

    global app

    if db_client == None:
        create_db_client()
 
    app = FastAPI()
    app.include_router(datasources_router)
    app.include_router(metadata_router)
    app.include_router(status_router)

    return app
    
if __name__ == "__main__":
    create_app().run()