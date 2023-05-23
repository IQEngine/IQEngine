# vim: tabstop=4 shiftwidth=4 expandtab
    
import os
from fastapi import FastAPI, Request

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