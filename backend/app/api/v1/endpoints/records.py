# backend/app/api/v1/endpoints/records.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.db.session import SessionLocal
from app.models.record import TravelRecord
from app.models.user import User
from app.schemas.record import TravelRecordCreate, TravelRecordRead

router = APIRouter()

# --- 数据库依赖注入 ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 模拟当前用户 (因为还没写登录，暂时写死一个 UserID) ---
# 等写了 Auth 模块后，这里会换成 get_current_user
def get_fake_user():
    return "user-uuid-123456" # 假设这是你的 ID

# ==========================================
# 接口 1: 获取足迹列表
# GET /api/v1/records
# ==========================================
@router.get("/", response_model=List[TravelRecordRead])
def read_records(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_fake_user)
):
    records = db.query(TravelRecord)\
        .filter(TravelRecord.user_id == current_user_id)\
        .order_by(TravelRecord.travel_date.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    return records

# ==========================================
# 接口 2: 新增足迹
# POST /api/v1/records
# ==========================================
@router.post("/", response_model=TravelRecordRead)
def create_record(
    record_in: TravelRecordCreate, 
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_fake_user)
):
    # 1. 构建数据库模型
    db_record = TravelRecord(
        id=str(uuid.uuid4()), # 生成 UUID
        user_id=current_user_id,
        province=record_in.province,
        city=record_in.city,
        spot_name=record_in.spot_name,
        travel_date=record_in.travel_date,
        weather=record_in.weather,
        thoughts=record_in.thoughts,
        images=record_in.images, # 直接存 List
        ai_tags=[] # 默认为空，以后由 AI 填充
    )
    
    # 2. 存入数据库
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    
    return db_record

# ==========================================
# 接口 3: 删除足迹
# DELETE /api/v1/records/{record_id}
# ==========================================
@router.delete("/{record_id}")
def delete_record(
    record_id: str,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_fake_user)
):
    record = db.query(TravelRecord).filter(
        TravelRecord.id == record_id,
        TravelRecord.user_id == current_user_id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    db.delete(record)
    db.commit()
    return {"ok": True}