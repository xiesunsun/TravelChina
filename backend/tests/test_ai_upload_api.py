from app.core.config import settings


def test_ai_chat_returns_non_empty_message(client):
    response = client.post(
        "/api/v1/ai/chat",
        json={"step": "location", "region": "浙江省"},
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["message"], str)
    assert data["message"].strip()


def test_upload_rejects_non_image(client):
    files = {"file": ("note.txt", b"hello", "text/plain")}
    response = client.post("/api/v1/upload/", files=files)
    assert response.status_code == 400
    assert response.json()["detail"] == "File must be an image"


def test_upload_reports_oss_config_error_when_missing(client, monkeypatch):
    monkeypatch.setattr(settings, "ALIYUN_ACCESS_KEY_ID", None)
    monkeypatch.setattr(settings, "ALIYUN_ACCESS_KEY_SECRET", None)
    monkeypatch.setattr(settings, "ALIYUN_OSS_BUCKET_NAME", None)
    monkeypatch.setattr(settings, "ALIYUN_OSS_ENDPOINT", None)
    monkeypatch.setattr(settings, "ALIYUN_OSS_DOMAIN", None)

    files = {"file": ("photo.jpg", b"fake-image", "image/jpeg")}
    response = client.post("/api/v1/upload/", files=files)
    assert response.status_code == 503
    assert "OSS configuration invalid" in response.json()["detail"]
