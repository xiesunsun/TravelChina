import pytest
from fastapi.testclient import TestClient

from app.core.config import ConfigValidationError, Settings
from app.main import app
from app.services.ai_service import AIService
from app.core.config import settings as runtime_settings


def _settings(**kwargs) -> Settings:
    base = {
        "ALIYUN_ACCESS_KEY_ID": None,
        "ALIYUN_ACCESS_KEY_SECRET": None,
        "ALIYUN_OSS_BUCKET_NAME": None,
        "ALIYUN_OSS_ENDPOINT": None,
        "ALIYUN_OSS_DOMAIN": None,
        "GEMINI_API_KEY": None,
        "REQUIRE_OSS_CONFIG": False,
        "REQUIRE_GEMINI_API_KEY": False,
    }
    base.update(kwargs)
    return Settings(**base)


def test_oss_validation_allows_empty_when_not_required():
    settings = _settings()
    settings.validate_oss_configuration(require_all=False)


def test_oss_validation_blocks_missing_when_required():
    settings = _settings()
    with pytest.raises(ConfigValidationError, match="Missing required OSS env vars"):
        settings.validate_oss_configuration(require_all=True)


def test_oss_validation_blocks_partial_config():
    settings = _settings(
        ALIYUN_ACCESS_KEY_ID="ak",
        ALIYUN_ACCESS_KEY_SECRET="sk",
    )
    with pytest.raises(ConfigValidationError, match="Partial OSS configuration detected"):
        settings.validate_oss_configuration(require_all=False)


def test_oss_validation_blocks_invalid_format():
    settings = _settings(
        ALIYUN_ACCESS_KEY_ID="ak",
        ALIYUN_ACCESS_KEY_SECRET="sk",
        ALIYUN_OSS_BUCKET_NAME="Bad_Bucket",
        ALIYUN_OSS_ENDPOINT="https://oss-cn-hangzhou.aliyuncs.com/path",
        ALIYUN_OSS_DOMAIN="invalid-domain",
    )
    with pytest.raises(ConfigValidationError) as exc_info:
        settings.validate_oss_configuration(require_all=True)

    message = str(exc_info.value)
    assert "ALIYUN_OSS_BUCKET_NAME" in message
    assert "ALIYUN_OSS_ENDPOINT" in message
    assert "ALIYUN_OSS_DOMAIN" in message


def test_llm_validation_requires_key_when_enabled():
    settings = _settings(GEMINI_API_KEY=None)
    with pytest.raises(ConfigValidationError, match="GEMINI_API_KEY is required"):
        settings.validate_llm_configuration(require_api_key=True)


def test_llm_validation_allows_missing_key_when_optional():
    settings = _settings(GEMINI_API_KEY=None)
    settings.validate_llm_configuration(require_api_key=False)


def test_runtime_configuration_respects_flags():
    settings = _settings(
        REQUIRE_OSS_CONFIG=True,
        REQUIRE_GEMINI_API_KEY=True,
    )
    with pytest.raises(ConfigValidationError):
        settings.validate_runtime_configuration()


def test_ai_probe_fails_fast_without_key(monkeypatch):
    monkeypatch.setattr("app.services.ai_service.client", None)
    monkeypatch.setattr("app.services.ai_service.settings.GEMINI_API_KEY", None)

    ok, detail = AIService.probe_live_client()

    assert ok is False
    assert "missing" in detail.lower()


def test_app_startup_fails_fast_when_oss_is_required(monkeypatch):
    monkeypatch.setattr(runtime_settings, "REQUIRE_OSS_CONFIG", True)
    monkeypatch.setattr(runtime_settings, "REQUIRE_GEMINI_API_KEY", False)
    monkeypatch.setattr(runtime_settings, "ALIYUN_ACCESS_KEY_ID", None)
    monkeypatch.setattr(runtime_settings, "ALIYUN_ACCESS_KEY_SECRET", None)
    monkeypatch.setattr(runtime_settings, "ALIYUN_OSS_BUCKET_NAME", None)
    monkeypatch.setattr(runtime_settings, "ALIYUN_OSS_ENDPOINT", None)
    monkeypatch.setattr(runtime_settings, "ALIYUN_OSS_DOMAIN", None)

    with pytest.raises(ConfigValidationError, match="Missing required OSS env vars"):
        with TestClient(app):
            pass


def test_app_startup_fails_fast_when_llm_key_is_required(monkeypatch):
    monkeypatch.setattr(runtime_settings, "REQUIRE_OSS_CONFIG", False)
    monkeypatch.setattr(runtime_settings, "REQUIRE_GEMINI_API_KEY", True)
    monkeypatch.setattr(runtime_settings, "GEMINI_API_KEY", "   ")

    with pytest.raises(ConfigValidationError, match="GEMINI_API_KEY is required"):
        with TestClient(app):
            pass
