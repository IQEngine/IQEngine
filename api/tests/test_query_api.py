import pytest
from unittest.mock import Mock, patch, MagicMock, call
from handlers.query import QueryCondition
import database.database
from main import app
import json

def test_query_meta_success(client):
    account = "test_account"
    container = "test_container"
    #query_condition = QueryCondition(query={"captures.core:frequency": {"$gte": 8486000000, "$lte": 8487000000}})
    query_condition = {"query": {"captures.core:frequency": {"$gte": 8486000000, "$lte": 8487000000}}}
    
    # Setup the mock to return some metadata when called
    mock_collection = MagicMock()
    mock_collection.find.return_value = [
        {"global.traceability:origin.account": "test_account", 
         "global.traceability:origin.container": "test_container", 
         "foo": "bar"}
    ]

    # Override the dependency
    app.dependency_overrides[database.database.metadata_collection] = mock_collection

    response = client.post(
        f"/api/datasources/{account}/{container}/query",
        json=query_condition
    )

    #assert response.status_code == 200
    assert response.json() == [
        {"global.traceability:origin.account": "test_account", 
         "global.traceability:origin.container": "test_container", 
         "foo": "bar"}
    ]

    # Reset the dependency overrides after the test
    app.dependency_overrides = {}


def test_query_meta_no_results(client):
    account = "test_account"
    container = "test_container"
    query_condition = QueryCondition(query={"foo": "bar"})
    
    # Setup the mock to return some metadata when called
    mock_collection = MagicMock()
    mock_collection.find.return_value = []
    
    # Patch the database
    with patch('database.database.metadata_collection', return_value=mock_collection):
        response = client.post(
            f"/api/datasources/{account}/{container}/query",
            json=query_condition.dict()
        )
    
    assert response.status_code == 200
    assert response.json() == []
