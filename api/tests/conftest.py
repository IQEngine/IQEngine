import pytest
from flask import Flask

def create_app(test_config=None):
    app = Flask(__name__, static_folder='./build', static_url_path='/')

    @app.route('/api/status')
    def get_status():
        return "OK"

    @app.route('/')
    def index():
        return app.send_static_file('index.html')
    
    return app

@pytest.fixture
def app():
    app = create_app()
    yield app

@pytest.fixture()
def client(app):
    return app.test_client()