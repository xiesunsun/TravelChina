# backend/app/api/v1/endpoints/upload.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.core.config import ConfigValidationError
from app.services.oss import upload_file_to_oss

router = APIRouter()

@router.post("/", summary="上传图片到 OSS")
async def upload_image(file: UploadFile = File(...)):
    """
    接收前端上传的文件，传到阿里云，返回 URL
    """
    # 1. 简单的文件类型校验
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # 2. 读取文件内容
    # 注意：如果文件巨大（几百MB），这种 read() 方式会占内存。但图片通常只有几 MB，没问题。
    content = await file.read()
    
    try:
        # 3. 调用服务上传
        url = upload_file_to_oss(content, file.filename, file.content_type)
        return {"url": url}
    except ConfigValidationError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        print(f"Upload failed: {e}") # 打印日志方便调试
        raise HTTPException(status_code=500, detail="Image upload failed")
