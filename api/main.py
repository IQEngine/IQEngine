import logging
import os
from logging.config import dictConfig

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from handlers.config import router as config_router
from handlers.datasources import router as datasources_router
from handlers.iq import router as iq_router
from handlers.metadata import router as metadata_router
from handlers.plugins import router as plugins_router
from handlers.status import router as status_router
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

app = FastAPI()
app.include_router(iq_router)
app.include_router(datasources_router)
app.include_router(metadata_router)
app.include_router(status_router)
app.include_router(config_router)
app.include_router(plugins_router)

app.mount("/", SPAStaticFiles(directory="iqengine", html=True), name="iqengine")


@app.exception_handler(ServerSelectionTimeoutError)
async def database_exception_handler(
    request: Request, exc: ServerSelectionTimeoutError
):
    return JSONResponse(
        status_code=503,
        content={"message": "Service Unavailable: Unable to connect to the database."},
    )


if __name__ == "__main__":
    print("Cannot be run standalone. Do 'uvicorn main:app' instead")
