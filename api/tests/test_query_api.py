import pytest
from tests.test_data import test_datasource, valid_metadata
from .test_data import valid_datasourcereference_array


@pytest.mark.asyncio
async def test_query_meta_success(client):
    query_condition = "min_frequency=8486280000&max_frequency=8486290000"

    client.post("/api/datasources", json=test_datasource).json()
    response = client.post(
        f'/api/datasources/{test_datasource["account"]}/{test_datasource["container"]}/file_path/meta',
        json=valid_metadata,
    )
    assert response.status_code == 201
    response = client.get(
        f"/api/datasources/query?{query_condition}"
    )

    assert response.status_code == 200
    assert response.json() == valid_datasourcereference_array
