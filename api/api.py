from flask import Flask


def create_app():
    app = Flask(__name__, static_folder="./build", static_url_path="/")

    @app.route("/api/status")
    def get_status():
        return "OK"

    @app.route("/")
    def index():
        return app.send_static_file("index.html")

    return app


if "__Name__" == "__main__":
    app = create_app()
    app.run()
