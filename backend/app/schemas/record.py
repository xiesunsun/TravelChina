# backend/app/schemas/record.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime

# --- 1. 基础模型 (Shared) ---
class TravelRecordBase(BaseModel):
    # 允许前端传 region 或 province，我们统一处理
    province: str = Field(..., description="省份/区域，对应前端 region")
    city: Optional[str] = Field(None, description="城市")
    spot_name: Optional[str] = Field(None, description="景点名称")
    
    travel_date: date
    weather: Optional[str] = "unknown"
    thoughts: Optional[str] = Field(None, description="对应前端 description")
    
    # 兼容性处理：前端目前是单图，但后端支持多图
    # 我们定义一个 images 列表，稍后在 API 里把前端的 imageUrl 塞进去
    images: List[str] = [] 

# --- 2. 创建时需要的字段 (Client -> Server) ---
class TravelRecordCreate(TravelRecordBase):
    # 允许接收前端旧字段，但在逻辑层转换
    # 这里的 logic 会在 api router 里写
    pass

# --- 3. 读取时返回的字段 (Server -> Client) ---
class TravelRecordRead(TravelRecordBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime]
    
    # AI 标签
    ai_tags: List[str] = []

    class Config:
        # 允许 Pydantic 读取 ORM 模型数据
        from_attributes = True