from unittest.mock import patch, MagicMock
from handlers.query import QueryCondition
import database.database
from main import app
from tests.test_data import test_datasource, valid_metadata


def override_metadata_collection():
    mock_collection = MagicMock()
    mock_collection.find.return_value = [
        {
            "global": {
                "core:datatype": "rf",
                "core:sample_rate": 1000000,
                "core:version": "0.0.1",
                "traceability": {
                    "origin": {"type":"api","account": "test_account", "container": "test_container", "file_path": "test_file_path"}
                },
                "captures": [
                    {
                        "core:sample_start": 0,
                        "core:global_index": 0,
                        "core:header_bytes": 0,
                        "core:frequency": 8486285000.0,
                        "core:datetime": "2020-12-20T17:32:07.142626",
                    }
                ],
                "annotations": [],
            }
        }
    ]
    return mock_collection


def test_query_meta_success(client):
    account = "test_account"
    container = "test_container"
    query_condition = QueryCondition(query={"captures.core:frequency": {"$gte": 8486000000, "$lte": 8487000000}})
    # query_condition = {
    #     "query": {"captures.core:frequency": {"$gte": 8486000000, "$lte": 8487000000}}
    # }

    # Override the dependency
    app.dependency_overrides[
        database.database.metadata_collection
    ] = override_metadata_collection

    response = client.post(
        f"/api/datasources/{account}/{container}/query", json=query_condition.dict()
    )

    # assert response.status_code == 200
    assert response.json() == [
        {
            "global.traceability:origin.account": "test_account",
            "global.traceability:origin.container": "test_container",
            "foo": "bar",
        }
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
    with patch("database.database.metadata_collection", return_value=mock_collection):
        response = client.post(
            f"/api/datasources/{account}/{container}/query", json=query_condition.dict()
        )

    assert response.status_code == 200
    assert response.json() == []
