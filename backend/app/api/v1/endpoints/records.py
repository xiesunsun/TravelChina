# backend/app/api/v1/endpoints/records.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.api.deps import get_current_user, get_db
from app.models.record import TravelRecord
from app.models.user import User
from app.schemas.record import TravelRecordCreate, TravelRecordRead

router = APIRouter()

# ==========================================
# 接口 1: 获取足迹列表
# GET /api/v1/records
# ==========================================
@router.get("/", response_model=List[TravelRecordRead])
def read_records(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = db.query(TravelRecord)\
        .filter(TravelRecord.user_id == current_user.id)\
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
    current_user: User = Depends(get_current_user)
):
    # 1. 构建数据库模型
    db_record = TravelRecord(
        id=str(uuid.uuid4()), # 生成 UUID
        user_id=current_user.id,
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
    current_user: User = Depends(get_current_user)
):
    record = db.query(TravelRecord).filter(
        TravelRecord.id == record_id,
        TravelRecord.user_id == current_user.id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    db.delete(record)
    db.commit()
    return {"ok": True}

# ==========================================
# 接口 4: 更新足迹
# PUT /api/v1/records/{record_id}
# ==========================================
@router.put("/{record_id}", response_model=TravelRecordRead)
def update_record(
    record_id: str,
    record_in: TravelRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(TravelRecord).filter(
        TravelRecord.id == record_id,
        TravelRecord.user_id == current_user.id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    # 更新字段
    record.province = record_in.province
    record.city = record_in.city
    record.spot_name = record_in.spot_name
    record.travel_date = record_in.travel_date
    record.weather = record_in.weather
    record.thoughts = record_in.thoughts
    record.images = record_in.images
    
    db.commit()
    db.refresh(record)
    return record
