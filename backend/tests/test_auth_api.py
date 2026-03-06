import os
import subprocess
import sys
import textwrap
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]


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


def test_auth_fresh_startup_auto_bootstraps_schema(tmp_path):
    db_path = tmp_path / "fresh_start.db"
    script = textwrap.dedent(
        """
        from fastapi.testclient import TestClient
        from app.main import app

        with TestClient(app) as client:
            register = client.post(
                "/api/v1/auth/register",
                json={"username": "root", "password": "rootmima"},
            )
            assert register.status_code == 201, register.text

            login = client.post(
                "/api/v1/auth/login",
                json={"username": "root", "password": "rootmima"},
            )
            assert login.status_code == 200, login.text
        """
    )

    env = os.environ.copy()
    env["SQLALCHEMY_DATABASE_URL"] = f"sqlite:///{db_path}"
    env["DB_BOOTSTRAP_ON_STARTUP"] = "true"
    env["PYTHONPATH"] = str(BACKEND_DIR)

    result = subprocess.run(
        [sys.executable, "-c", script],
        cwd=BACKEND_DIR,
        env=env,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, f"{result.stdout}\n{result.stderr}"


def test_auth_missing_schema_returns_guided_503_when_bootstrap_disabled(tmp_path):
    db_path = tmp_path / "missing_schema.db"
    script = textwrap.dedent(
        """
        from fastapi.testclient import TestClient
        from app.main import app

        with TestClient(app) as client:
            response = client.post(
                "/api/v1/auth/register",
                json={"username": "root", "password": "rootmima"},
            )
            assert response.status_code == 503, response.text
            assert "alembic upgrade head" in response.text, response.text
        """
    )

    env = os.environ.copy()
    env["SQLALCHEMY_DATABASE_URL"] = f"sqlite:///{db_path}"
    env["DB_BOOTSTRAP_ON_STARTUP"] = "false"
    env["PYTHONPATH"] = str(BACKEND_DIR)

    result = subprocess.run(
        [sys.executable, "-c", script],
        cwd=BACKEND_DIR,
        env=env,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, f"{result.stdout}\n{result.stderr}"
