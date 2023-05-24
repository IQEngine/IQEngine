import os

from dotenv import load_dotenv
from flask import Flask


def create_app():
    load_dotenv()
    app = Flask(__name__, static_folder="./build", static_url_path="/")

    @app.route("/")
    def index():
        return app.send_static_file("index.html")

    @app.route("/api/config")
    def get_config():
        return {
            "detectorEndpoint": os.environ.get("DETECTOR_ENDPOINT", None),
            "connectionInfo": os.environ.get("CONNECTION_INFO", None),
            "googleAnalyticsKey": os.environ.get("GOOGLE_ANALYTICS_KEY", None),
        }

    @app.route("/api/status")
    def get_status():
        return "OK"

    return app


if "__Name__" == "__main__":
    app = create_app()
    app.run()
