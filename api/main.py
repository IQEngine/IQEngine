import logging
import os
from logging.config import dictConfig

from app.database import db
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles

from app.config_router import router as config_router
from app.datasources_router import router as datasources_router
from app.iq_router import router as iq_router
from app.plugins_router import router as plugins_router
from app.status_router import router as status_router
from app.users_router import router as users_router
from app.converter_router import router as converter_router

from helpers.apidisconnect import CancelOnDisconnectRoute
from helpers.import_env import import_all_from_env
from pydantic import BaseModel
from pymongo.errors import ServerSelectionTimeoutError
from starlette.exceptions import HTTPException
from starlette.responses import JSONResponse

load_dotenv()

# check if the iqengine directory exists and create it if not
if not os.path.exists("iqengine"):
    os.makedirs("iqengine")


class SPAStaticFiles(StaticFiles):
    """
    This class is used to serve the static files for the SPA.
    It will return the index.html file for any path that is not found.
    """

    async def get_response(self, path: str, scope):
        print("parsing static files", path)
        try:
            response = await super().get_response(path, scope)
        except HTTPException as e:
            print("HTTP Exception", e)
            response = await super().get_response("index.html", scope)
        except Exception as e:
            print("Exception", e)
            response = await super().get_response("index.html", scope)
        if response.status_code == 404:
            response = await super().get_response("index.html", scope)
        return response


class LogConfig(BaseModel):
    """Logging configuration to be set for the server"""

    LOGGER_NAME: str = "api"
    LOG_FORMAT: str = "%(levelprefix)s | %(asctime)s | %(message)s"
    LOG_LEVEL: str = "DEBUG"

    # Logging config
    version = 1
    disable_existing_loggers = False
    formatters = {
        "default": {
            "()": "uvicorn.logging.DefaultFormatter",
            "fmt": LOG_FORMAT,
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    }
    handlers = {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stderr",
        },
    }
    loggers = {
        LOGGER_NAME: {"handlers": ["default"], "level": LOG_LEVEL},
    }


dictConfig(LogConfig().dict())
logger = logging.getLogger("api")

app = FastAPI(docs_url="/api_docs")
app.router.route_class = CancelOnDisconnectRoute  # our Custom route (path operation) class to be used by this router

app.include_router(iq_router)
app.include_router(datasources_router)
app.include_router(status_router)
app.include_router(config_router)
app.include_router(plugins_router)
app.include_router(users_router)
app.include_router(converter_router)

app.mount("/", SPAStaticFiles(directory="iqengine", html=True), name="iqengine")

app.add_event_handler("startup", db)  # connect to mongodb or set up in-memory db
app.add_event_handler("startup", import_all_from_env)  # clears db and adds plugins, feature flags, datasources, metadata


@app.exception_handler(ServerSelectionTimeoutError)
async def database_exception_handler():
    return JSONResponse(
        status_code=503,
        content={
            "message": "Service Unavailable: Unable to connect to the database."},
    )


if __name__ == "__main__":
    print("Cannot be run standalone. Do 'uvicorn main:app' instead")
