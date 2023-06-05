import json
import os

from fastapi import APIRouter

router = APIRouter()


@router.get("/api/config", status_code=200)
def get_config():
    """
    get the IQEngine configuration from the environment variables
    """
    connection_info = os.getenv("CONNECTION_INFO", None)
    if connection_info:
        connection_info = json.loads(connection_info)
    return {
        "detectorEndpoint": os.getenv("DETECTOR_ENDPOINT", None),
        "connectionInfo": connection_info,
        "googleAnalyticsKey": os.getenv("GOOGLE_ANALYTICS_KEY", None),
    }
