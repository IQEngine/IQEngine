def test_api_returns_ok(client):
    response = client.get('/api/status') 
    assert response.status_code == 200 
    assert response.data == b'OK'
