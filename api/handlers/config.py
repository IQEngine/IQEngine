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
    plugins_endpoint = os.getenv("PLUGINS_ENDPOINT", None)
    if plugins_endpoint and plugins_endpoint[-1] != '/':
        plugins_endpoint += '/'
    return {
        "pluginsEndpoint": plugins_endpoint,
        "connectionInfo": connection_info,
        "googleAnalyticsKey": os.getenv("GOOGLE_ANALYTICS_KEY", None),
    }
