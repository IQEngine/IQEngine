import json
import os

from fastapi import APIRouter

router = APIRouter()


@router.get("/api/config", status_code=200)
def get_config():
    """
    get the IQEngine configuration from the environment variables
    """
    connection_info = os.getenv("IQENGINE_CONNECTION_INFO", None)
    if connection_info:
        connection_info = json.loads(connection_info)

    feature_flags = os.getenv("IQENGINE_FEATURE_FLAGS", None)
    if feature_flags:
        feature_flags = json.loads(feature_flags)

    return {
        "connectionInfo": connection_info,
        "googleAnalyticsKey": os.getenv("IQENGINE_GOOGLE_ANALYTICS_KEY", None),
        "featureFlags": feature_flags,
    }
