def test_auth_register_and_login(client):
    register_response = client.post(
        "/api/v1/auth/register",
        json={"username": "alice", "password": "safe-pass-123"},
    )
    assert register_response.status_code == 201
    assert register_response.json()["username"] == "alice"

    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": "alice", "password": "safe-pass-123"},
    )
    assert login_response.status_code == 200
    data = login_response.json()
    assert data["token_type"] == "bearer"
    assert data["access_token"]


def test_auth_register_rejects_short_password(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"username": "root", "password": "root"},
    )

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert isinstance(detail, list)
    assert detail[0]["loc"] == ["body", "password"]
    assert detail[0]["type"] == "string_too_short"


def test_auth_login_rejects_short_password_input(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "root", "password": "root"},
    )

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert isinstance(detail, list)
    assert detail[0]["loc"] == ["body", "password"]
    assert detail[0]["type"] == "string_too_short"


def test_auth_rejects_bad_password(client):
    client.post(
        "/api/v1/auth/register",
        json={"username": "bob", "password": "safe-pass-123"},
    )

    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": "bob", "password": "wrong-pass"},
    )
    assert login_response.status_code == 401


def test_auth_rejects_duplicate_username(client):
    payload = {"username": "dup", "password": "safe-pass-123"}
    first = client.post("/api/v1/auth/register", json=payload)
    second = client.post("/api/v1/auth/register", json=payload)

    assert first.status_code == 201
    assert second.status_code == 409
