import json
import os

from database import config_repo
from database.config_repo import exists, get
from database.models import Configuration
from fastapi import APIRouter, Depends, HTTPException
from motor.core import AgnosticCollection

router = APIRouter()


@router.get("/api/config", status_code=200, response_model=Configuration)
async def get_config():
    """
    get the IQEngine configuration
    """
    configuration = await get()

    if configuration is None:
        configuration = Configuration()

    connection_info = os.getenv("IQENGINE_CONNECTION_INFO", None)

    if connection_info:
        configuration.connection_info = json.loads(connection_info)

    configuration.google_analytics_key = os.getenv(
        "IQENGINE_GOOGLE_ANALYTICS_KEY", configuration.google_analytics_key
    )
    configuration.internal_branding = os.getenv(
        "IQENGINE_INTERNAL_BRANDING", configuration.internal_branding
    )
    configuration.app_id = os.getenv("IQENGINE_APP_ID", configuration.app_id)
    configuration.app_authority = os.getenv(
        "IQENGINE_APP_AUTHORITY", configuration.app_authority
    )

    return configuration


@router.put("/api/config", status_code=200)
async def update_config(
    config: Configuration,
    configuration: AgnosticCollection = Depends(config_repo.collection),
):
    """
    update the IQEngine configuration
    """
    if not (await exists()):
        raise HTTPException(status_code=409, detail="Configuration does not exist")

    configuration.update_one(
        {}, {"$set": config.dict(by_alias=True, exclude_unset=True)}
    )
    return 200
