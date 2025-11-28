# backend/app/core/config.py
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # --- 基础配置 ---
    PROJECT_NAME: str = "Huixing Zhonghua API"
    API_V1_STR: str = "/api/v1"
    
    # --- 阿里云 OSS 配置 (自动读取 .env 中对应的字段) ---
    # 比如 .env 里叫 ALIYUN_ACCESS_KEY_ID，这里就会自动匹配
    ALIYUN_ACCESS_KEY_ID: str
    ALIYUN_ACCESS_KEY_SECRET: str
    ALIYUN_OSS_BUCKET_NAME: str
    ALIYUN_OSS_ENDPOINT: str # 例如: oss-cn-hangzhou.aliyuncs.com
    ALIYUN_OSS_DOMAIN: str

    class Config:
        # 告诉 Pydantic 去哪里找 .env 文件
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()