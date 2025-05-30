import json
import os

from fastapi import APIRouter, HTTPException

from .config import exists, get
from .database import db
from .models import Configuration

router = APIRouter()


@router.get("/api/config", status_code=200, response_model=Configuration)
async def get_config():
    configuration: Configuration | None = await get()

    if configuration is None:
        configuration = Configuration()

    connection_info = os.getenv("IQENGINE_CONNECTION_INFO", None)
    if connection_info:
        configuration.connection_info = json.loads(connection_info)

    feature_flags = os.getenv("IQENGINE_FEATURE_FLAGS", None)
    if feature_flags:
        configuration.feature_flags = json.loads(feature_flags)

    # Add the environment variables that are not part of IQENGINE_FEATURE_FLAGS
    configuration.google_analytics_key = os.getenv("IQENGINE_GOOGLE_ANALYTICS_KEY", configuration.google_analytics_key)
    configuration.UPLOAD_PAGE_BLOB_SAS_URL = os.getenv("IQENGINE_UPLOAD_PAGE_BLOB_SAS_URL", configuration.UPLOAD_PAGE_BLOB_SAS_URL)
    configuration.internal_branding = os.getenv("IQENGINE_INTERNAL_BRANDING", configuration.internal_branding)
    configuration.app_id = os.getenv("IQENGINE_APP_ID", configuration.app_id)
    configuration.app_authority = os.getenv("IQENGINE_APP_AUTHORITY", configuration.app_authority)
    return configuration


@router.put("/api/config", status_code=200)
async def update_config(config: Configuration):
    if not (await exists()):
        raise HTTPException(status_code=409, detail="Configuration does not exist")

    await db().configuration.update_one({}, {"$set": config.dict(by_alias=True, exclude_unset=True)})
    return 200
