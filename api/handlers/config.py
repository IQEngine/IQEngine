import os

from fastapi import APIRouter

router = APIRouter()


@router.get("/api/config", status_code=200)
def get_config():
    """
    get the IQEngine configuration from the environment variables
    """
    return {
        "detectorEndpoint": os.getenv("DETECTOR_ENDPOINT", None),
        "connectionInfo": os.getenv("CONNECTION_INFO", None),
        "googleAnalyticsKey": os.getenv("GOOGLE_ANALYTICS_KEY", None),
    }
