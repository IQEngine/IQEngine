# vim: tabstop=4 shiftwidth=4 expandtab

import pytest

def test_api_returns_ok(client):
    response = client.get('/api/status') 
    assert response.status_code == 200 
    assert response.data == b'OK'

def test_api_post_meta(client):
    response = client.post('/api/datasources/source_id/file_path/meta', json = {})
    assert response.status_code == 200

def test_api_post_existing_meta(client):
    response = client.post('/api/datasources/source_id/file_path/meta', json = {})
    response = client.post('/api/datasources/source_id/file_path/meta', json = {})
    assert response.status_code == 400

#@pytest.mark.skip()
def test_api_put_meta(client):
    response = client.post('/api/datasources/source_id/file_path/meta', json = {})
    response = client.put('/api/datasources/source_id/file_path/meta', json = {})
    assert response.status_code == 200 

def test_api_put_meta_not_existing(client):
    response = client.put('/api/datasources/source_id/file_path/meta', json = {})
    assert response.status_code == 404 
