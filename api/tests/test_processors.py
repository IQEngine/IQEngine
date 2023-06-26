# vim: tabstop=4 shiftwidth=4 expandtab
# vim: tabstop=4 shiftwidth=4 expandtab



def test_api_create_processor(client):
    test_processor = {
        "name": "test_processor",
        "url": "http://test_processor.com",
    }
    response = client.post("/api/processors", json=test_processor)
    assert response.status_code == 201
    assert response.json() == test_processor


def test_api_create_processor_cannot_duplicate(client):
    test_processor = {
        "name": "test_processor",
        "url": "http://test_processor.com",
    }
    response = client.post("/api/processors", json=test_processor)
    assert response.status_code == 201
    assert response.json() == test_processor
    response = client.post("/api/processors", json=test_processor)
    assert response.status_code == 409


def test_api_get_processors(client):
    test_processor = {
        "name": "test_processor",
        "url": "http://test_processor.com",
    }
    response = client.post("/api/processors", json=test_processor)
    assert response.status_code == 201
    assert response.json() == test_processor
    response = client.get("/api/processors")
    assert response.status_code == 200
    assert response.json() == [test_processor]


def test_api_get_processor(client):
    test_processor = {
        "name": "test_processor",
        "url": "http://test_processor.com",
    }
    response = client.post("/api/processors", json=test_processor)
    assert response.status_code == 201
    assert response.json() == test_processor
    response = client.get("/api/processors/test_processor")
    assert response.status_code == 200
    assert response.json() == test_processor


def test_api_get_processor_not_found(client):
    response = client.get("/api/processors/test_processor")
    assert response.status_code == 404


def test_api_update_processor(client):
    test_processor = {
        "name": "test_processor",
        "url": "http://test_processor.com",
    }
    response = client.post("/api/processors", json=test_processor)
    assert response.status_code == 201
    assert response.json() == test_processor
    test_processor["url"] = "http://test_processor2.com"
    response = client.put("/api/processors/test_processor", json=test_processor)
    assert response.status_code == 200
    assert response.json() == test_processor


def test_api_update_processor_not_found(client):
    test_processor = {
        "name": "test_processor",
        "url": "http://test_processor.com",
    }
    response = client.put("/api/processors/test_processor", json=test_processor)
    assert response.status_code == 404


def test_api_delete_processore(client):
    test_processor = {
        "name": "test_processor",
        "url": "http://test_processor.com",
    }
    response = client.post("/api/processors", json=test_processor)
    assert response.status_code == 201
    assert response.json() == test_processor
    response = client.delete("/api/processors/test_processor")
    assert response.status_code == 200
    response = client.get("/api/processors/test_processor")
    assert response.status_code == 404
