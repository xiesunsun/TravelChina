import pytest

from app.core.config import Settings


def test_runtime_security_guard_allows_development_default_secret():
    settings = Settings(ENVIRONMENT="development", JWT_SECRET_KEY="dev-only-change-me")
    settings.validate_runtime_security()


def test_runtime_security_guard_blocks_default_secret_in_production():
    settings = Settings(ENVIRONMENT="production", JWT_SECRET_KEY="dev-only-change-me")
    with pytest.raises(ValueError, match="must be overridden"):
        settings.validate_runtime_security()


def test_runtime_security_guard_blocks_short_secret_in_staging():
    settings = Settings(ENVIRONMENT="staging", JWT_SECRET_KEY="short-secret")
    with pytest.raises(ValueError, match="at least 32 characters"):
        settings.validate_runtime_security()


def test_runtime_security_guard_accepts_long_secret_in_production():
    settings = Settings(
        ENVIRONMENT="production",
        JWT_SECRET_KEY="this-is-a-long-production-secret-key-32+",
    )
    settings.validate_runtime_security()
