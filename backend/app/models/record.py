from sqlalchemy import Column, String, Date, Text, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.base_class import Base

class TravelRecord(Base):
    __tablename__ = "travel_records"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)

    province = Column(String(50), nullable=False, index=True)
    city = Column(String(100), nullable=True)
    spot_name = Column(String(100), nullable=True)

    travel_date = Column(Date, nullable=False)
    weather = Column(String(20), nullable=True)

    thoughts = Column(Text, nullable=True)
    images = Column(JSON, nullable=True)
    ai_tags = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())