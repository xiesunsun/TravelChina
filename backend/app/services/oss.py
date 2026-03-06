# backend/app/services/oss.py
import oss2
import uuid
import os
from datetime import datetime
from app.core.config import settings

def upload_file_to_oss(file_bytes: bytes, filename: str, content_type: str) -> str:
    """
    上传文件到阿里云 OSS，并返回完整的 URL
    """
    settings.validate_oss_configuration(require_all=True)

    # 1. 初始化 Auth 和 Bucket
    auth = oss2.Auth(settings.ALIYUN_ACCESS_KEY_ID, settings.ALIYUN_ACCESS_KEY_SECRET)
    bucket = oss2.Bucket(auth, settings.ALIYUN_OSS_ENDPOINT, settings.ALIYUN_OSS_BUCKET_NAME)


    # 2. 生成安全且唯一的文件路径
    # 格式: images/2024/05/uuid-original_name.jpg
    # 这样分类存储，方便以后管理
    ext = os.path.splitext(filename)[1] # 获取后缀 .jpg
    today = datetime.now().strftime("%Y/%m")
    unique_name = f"{uuid.uuid4()}{ext}"
    object_name = f"images/{today}/{unique_name}"

    # 3. 上传
    # headers 主要是为了设置 Content-Type，这样浏览器打开链接能直接预览而不是下载
    headers = {'Content-Type': content_type}
    bucket.put_object(object_name, file_bytes, headers=headers)

    base_domain = settings.ALIYUN_OSS_DOMAIN.rstrip("/")
    url = f"{base_domain}/{object_name}"
    
    return url
