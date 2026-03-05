# backend/app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # --- 基础配置 ---
    PROJECT_NAME: str = "Huixing Zhonghua API"
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

    # --- Auth 配置 ---
    JWT_SECRET_KEY: str = "dev-only-change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

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

settings = Settings()
