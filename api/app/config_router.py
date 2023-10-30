import json
import os

from . import config
from .config import exists, get
from .models import Configuration
from fastapi import APIRouter, Depends, HTTPException
from motor.core import AgnosticCollection
from . import aiquery

router = APIRouter()


@router.get("/api/config", status_code=200, response_model=Configuration)
async def get_config():
    """
    get the IQEngine configuration
    """
    configuration: Configuration | None = await get()

    if configuration is None:
        configuration = Configuration()

    connection_info = os.getenv("IQENGINE_CONNECTION_INFO", None)
    if connection_info:
        configuration.connection_info = json.loads(connection_info)

    feature_flags = os.getenv("IQENGINE_FEATURE_FLAGS", None)
    if feature_flags:
        configuration.feature_flags = json.loads(feature_flags)

    configuration.google_analytics_key = os.getenv(
        "IQENGINE_GOOGLE_ANALYTICS_KEY", configuration.google_analytics_key
    )
    configuration.UPLOAD_PAGE_BLOB_SAS_URL = os.getenv(
        "IQENGINE_UPLOAD_PAGE_BLOB_SAS_URL", configuration.UPLOAD_PAGE_BLOB_SAS_URL
    )
    configuration.internal_branding = os.getenv(
        "IQENGINE_INTERNAL_BRANDING", configuration.internal_branding
    )
    configuration.app_id = os.getenv("IQENGINE_APP_ID", configuration.app_id)
    configuration.app_authority = os.getenv(
        "IQENGINE_APP_AUTHORITY", configuration.app_authority
    )

    configuration.has_ai_query = aiquery.is_open_ai_available()

    return configuration


@router.put("/api/config", status_code=200)
async def update_config(
    config: Configuration,
    configuration: AgnosticCollection = Depends(config.collection),
):
    """
    update the IQEngine configuration
    """
    if not (await exists()):
        raise HTTPException(status_code=409, detail="Configuration does not exist")

    await configuration.update_one(
        {}, {"$set": config.dict(by_alias=True, exclude_unset=True)}
    )
    return 200
