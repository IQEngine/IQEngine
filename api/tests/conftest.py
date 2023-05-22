# vim: tabstop=4 shiftwidth=4 expandtab

import pytest
from pymongo_inmemory import MongoClient
from flask import Flask
from api.api import create_app

@pytest.fixture
def app():
    db_client = MongoClient() 
    app = create_app(db_client)
    yield app

@pytest.fixture()
def client(app):
    return app.test_client()
