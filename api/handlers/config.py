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
    detector_endpoint = os.getenv("DETECTOR_ENDPOINT", None)
    if detector_endpoint[-1] != '/':
        detector_endpoint += '/'
    return {
        "detectorEndpoint": detector_endpoint,
        "connectionInfo": connection_info,
        "googleAnalyticsKey": os.getenv("GOOGLE_ANALYTICS_KEY", None),
    }
