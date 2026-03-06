import re
from typing import Optional
from urllib.parse import urlparse

from pydantic_settings import BaseSettings, SettingsConfigDict


_OSS_ENDPOINT_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9.-]*(?::\d{1,5})?$")
_OSS_BUCKET_PATTERN = re.compile(r"^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$")


class ConfigValidationError(ValueError):
    def __init__(self, component: str, errors: list[str]):
        self.component = component
        self.errors = errors
        detail = "; ".join(errors)
        super().__init__(f"{component} configuration invalid: {detail}")


class Settings(BaseSettings):
    # --- 基础配置 ---
    PROJECT_NAME: str = "TravelChina API"
    ENVIRONMENT: str = "development"
    API_V1_STR: str = "/api/v1"
    SQLALCHEMY_DATABASE_URL: str = "sqlite:///./huixing.db"
    
    # --- 阿里云 OSS 配置 (自动读取 .env 中对应的字段) ---
    # 比如 .env 里叫 ALIYUN_ACCESS_KEY_ID，这里就会自动匹配
    ALIYUN_ACCESS_KEY_ID: Optional[str] = None
    ALIYUN_ACCESS_KEY_SECRET: Optional[str] = None
    ALIYUN_OSS_BUCKET_NAME: Optional[str] = None
    ALIYUN_OSS_ENDPOINT: Optional[str] = None # 例如: oss-cn-hangzhou.aliyuncs.com
    ALIYUN_OSS_DOMAIN: Optional[str] = None
    
    # --- AI 配置 ---
    GEMINI_API_KEY: Optional[str] = None
    REQUIRE_GEMINI_API_KEY: bool = False

    # --- Auth 配置 ---
    JWT_SECRET_KEY: str = "dev-only-change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # --- Runtime feature guardrails ---
    REQUIRE_OSS_CONFIG: bool = False
    DB_BOOTSTRAP_ON_STARTUP: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )

    def validate_runtime_security(self) -> None:
        env_name = self.ENVIRONMENT.strip().lower()
        if env_name not in {"production", "staging"}:
            return

        if self.JWT_SECRET_KEY == "dev-only-change-me":
            raise ValueError(
                "JWT_SECRET_KEY must be overridden in production/staging environment"
            )

        if len(self.JWT_SECRET_KEY) < 32:
            raise ValueError(
                "JWT_SECRET_KEY must be at least 32 characters in production/staging environment"
            )

    @staticmethod
    def _is_non_empty(value: Optional[str]) -> bool:
        return bool(value and value.strip())

    def has_gemini_api_key(self) -> bool:
        return self._is_non_empty(self.GEMINI_API_KEY)

    def collect_oss_validation_errors(self, require_all: bool = False) -> list[str]:
        errors: list[str] = []
        required = {
            "ALIYUN_ACCESS_KEY_ID": self.ALIYUN_ACCESS_KEY_ID,
            "ALIYUN_ACCESS_KEY_SECRET": self.ALIYUN_ACCESS_KEY_SECRET,
            "ALIYUN_OSS_BUCKET_NAME": self.ALIYUN_OSS_BUCKET_NAME,
            "ALIYUN_OSS_ENDPOINT": self.ALIYUN_OSS_ENDPOINT,
            "ALIYUN_OSS_DOMAIN": self.ALIYUN_OSS_DOMAIN,
        }
        missing = [name for name, value in required.items() if not self._is_non_empty(value)]
        provided_count = len(required) - len(missing)

        if require_all:
            if missing:
                errors.append(f"Missing required OSS env vars: {', '.join(missing)}")
        elif 0 < provided_count < len(required):
            errors.append(
                "Partial OSS configuration detected; provide all required OSS env vars or clear them all. "
                f"Missing: {', '.join(missing)}"
            )

        endpoint = (self.ALIYUN_OSS_ENDPOINT or "").strip()
        if endpoint:
            if "://" in endpoint or "/" in endpoint or not _OSS_ENDPOINT_PATTERN.fullmatch(endpoint):
                errors.append(
                    "ALIYUN_OSS_ENDPOINT must be host[:port] without scheme/path, "
                    "e.g. oss-cn-hangzhou.aliyuncs.com"
                )

        bucket = (self.ALIYUN_OSS_BUCKET_NAME or "").strip()
        if bucket and not _OSS_BUCKET_PATTERN.fullmatch(bucket):
            errors.append(
                "ALIYUN_OSS_BUCKET_NAME must be 3-63 chars: lowercase letters, numbers, hyphen; "
                "must start and end with lowercase letter or number"
            )

        domain = (self.ALIYUN_OSS_DOMAIN or "").strip()
        if domain:
            parsed = urlparse(domain)
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                errors.append("ALIYUN_OSS_DOMAIN must be a valid http(s) URL origin")
            elif parsed.query or parsed.fragment:
                errors.append("ALIYUN_OSS_DOMAIN must not contain query/fragment")
            elif parsed.path not in {"", "/"}:
                errors.append("ALIYUN_OSS_DOMAIN must not contain a path; use origin only")

        return errors

    def validate_oss_configuration(self, require_all: bool = False) -> None:
        errors = self.collect_oss_validation_errors(require_all=require_all)
        if errors:
            raise ConfigValidationError("OSS", errors)

    def collect_llm_validation_errors(self, require_api_key: bool = False) -> list[str]:
        errors: list[str] = []

        if self.GEMINI_API_KEY is not None and not self._is_non_empty(self.GEMINI_API_KEY):
            errors.append("GEMINI_API_KEY is set but empty")

        if require_api_key and not self.has_gemini_api_key():
            errors.append(
                "GEMINI_API_KEY is required but missing. "
                "Set GEMINI_API_KEY or disable REQUIRE_GEMINI_API_KEY."
            )

        return errors

    def validate_llm_configuration(self, require_api_key: bool = False) -> None:
        errors = self.collect_llm_validation_errors(require_api_key=require_api_key)
        if errors:
            raise ConfigValidationError("LLM", errors)

    def validate_runtime_configuration(self) -> None:
        self.validate_oss_configuration(require_all=self.REQUIRE_OSS_CONFIG)
        self.validate_llm_configuration(require_api_key=self.REQUIRE_GEMINI_API_KEY)

settings = Settings()
