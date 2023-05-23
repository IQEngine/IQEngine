# vim: tabstop=4 shiftwidth=4 expandtab

import pytest

def test_api_returns_ok(client):
    response = client.get('/api/status') 
    assert response.status_code == 200 
    assert response.json() == "OK"

"""
def test_api_post_meta(client):
    response = client.post('/api/datasources/source_id/file_path/meta', json = {})
    assert response.status_code == 201
"""
"""
def test_api_post_existing_meta(client):
    response = client.post('/api/datasources/source_id/file_path/meta', json = {})
    response = client.post('/api/datasources/source_id/file_path/meta', json = {})
    assert response.status_code == 400
"""

#@pytest.mark.skip()
def test_api_put_meta(client):
    #response = client.post('/api/datasources/source_id/file_path/meta', json = {})
    response = client.put('/api/datasources/source_id/file_path/meta', json = { "test" : "string" })
    assert response.status_code == 201
    response = client.put('/api/datasources/source_id/file_path/meta', json = { "something" : "else"})
    assert response.status_code == 204 

def test_api_put_meta_not_existing(client):
    response = client.put('/api/datasources/source_id/file_path/meta', json = {})
    assert response.status_code == 200 #Inserts new meta 

def test_api_get_meta(client):
    response = client.put('/api/datasources/source_id/file_path/meta', json = { "test" : "string"})
    response = client.get('/api/datasources/source_id/file_path/meta')
    assert response.status_code == 200
    assert response.json["version_number"] == 0
    assert response.json['metadata']["test"] == "string"

def test_api_get_meta_not_existing(client):
    response = client.get('/api/datasources/source_id/file_path/meta')
    assert response.status_code == 404

def test_api_get_all_meta(client):
    response = client.get('/api/datasources/source_id/meta')
    assert response.status_code == 200
    assert len(response.json["metadata"]) == 0
    response = client.put('/api/datasources/source_id/record_a/meta', json = { "record" : "a"})
    response = client.put('/api/datasources/source_id/record_b/meta', json = { "record" : "b"})
    response = client.get('/api/datasources/source_id/meta')
    assert response.status_code == 200
    assert len(response.json["metadata"]) == 2

def test_api_create_datasource(client):
    datasource = {
      "name" : "name",
      "accountName" : "accountName",
      "containerName" : "containerName",
      "description" : "description"
    }
    response = client.post('/api/datasources', json = datasource)
    assert response.status_code == 201

def test_api_get_datasources(client):
    response = client.get('/api/datasources')
    assert response.status_code == 200
    assert len(response.json()["datasources"]) == 0
    response = client.post('/api/datasources', json = { "filepath" : "record_a" })
    response = client.get('/api/datasources')
    assert response.status_code == 200
    assert len(response.json()["datasources"]) == 1
