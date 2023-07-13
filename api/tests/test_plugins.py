# vim: tabstop=4 shiftwidth=4 expandtab


import pytest


@pytest.mark.asyncio
async def test_api_create_plugin(client):
    test_plugin = {
        "name": "test_plugin",
        "url": "http://test_plugin.com",
    }
    response = client.post("/api/plugins", json=test_plugin)
    assert response.status_code == 201
    assert response.json() == test_plugin


@pytest.mark.asyncio
async def test_api_create_plugin_cannot_duplicate(client):
    test_plugin = {
        "name": "test_plugin",
        "url": "http://test_plugin.com",
    }
    response = client.post("/api/plugins", json=test_plugin)
    assert response.status_code == 201
    assert response.json() == test_plugin
    response = client.post("/api/plugins", json=test_plugin)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_api_create_plugin_cannot_duplicate_name(client):
    test_plugin = {
        "name": "test_plugin",
        "url": "http://test_plugin.com",
    }
    response = client.post("/api/plugins", json=test_plugin)
    assert response.status_code == 201
    assert response.json() == test_plugin
    test_plugin["url"] = "http://test_plugin2.com"
    response = client.post("/api/plugins", json=test_plugin)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_api_get_plugins(client):
    test_plugin = {
        "name": "test_plugin",
        "url": "http://test_plugin.com",
    }
    response = client.post("/api/plugins", json=test_plugin)
    assert response.status_code == 201
    assert response.json() == test_plugin
    response = client.get("/api/plugins")
    assert response.status_code == 200
    assert response.json() == [test_plugin]


@pytest.mark.asyncio
async def test_api_get_plugin(client):
    test_plugin = {
        "name": "test_plugin",
        "url": "http://test_plugin.com",
    }
    response = client.post("/api/plugins", json=test_plugin)
    assert response.status_code == 201
    assert response.json() == test_plugin
    response = client.get("/api/plugins/test_plugin")
    assert response.status_code == 200
    assert response.json() == test_plugin


@pytest.mark.asyncio
async def test_api_get_plugin_not_found(client):
    response = client.get("/api/plugins/test_plugin")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_api_update_plugin(client):
    test_plugin = {
        "name": "test_plugin",
        "url": "http://test_plugin.com",
    }
    response = client.post("/api/plugins", json=test_plugin)
    assert response.status_code == 201
    assert response.json() == test_plugin
    test_plugin["url"] = "http://test_plugin2.com"
    response = client.put("/api/plugins/test_plugin", json=test_plugin)
    assert response.status_code == 200
    assert response.json() == test_plugin


@pytest.mark.asyncio
async def test_api_update_plugin_not_found(client):
    test_plugin = {
        "name": "test_plugin",
        "url": "http://test_plugin.com",
    }
    response = client.put("/api/plugins/test_plugin", json=test_plugin)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_api_delete_plugine(client):
    test_plugin = {
        "name": "test_plugin",
        "url": "http://test_plugin.com",
    }
    response = client.post("/api/plugins", json=test_plugin)
    assert response.status_code == 201
    assert response.json() == test_plugin
    response = client.delete("/api/plugins/test_plugin")
    assert response.status_code == 200
    response = client.get("/api/plugins/test_plugin")
    assert response.status_code == 404
