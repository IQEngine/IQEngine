def test_api_returns_ok(client):
    response = client.get("/api/status")
    if not response.status_code == 200:
        raise AssertionError
    if not response.data == b"OK":
        raise AssertionError
