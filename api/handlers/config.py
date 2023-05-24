from fastapi import APIRouter
from dotenv import load_dotenv

router = APIRouter()

@router.route("/api/config")
def get_config():
    load_dotenv()
    return {
        "detectorEndpoint": os.environ.get("DETECTOR_ENDPOINT", None),
        "connectionInfo": os.environ.get("CONNECTION_INFO", None),
        "googleAnalyticsKey": os.environ.get("GOOGLE_ANALYTICS_KEY", None),
    }
