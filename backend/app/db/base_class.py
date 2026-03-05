# backend/app/db/base_class.py
from typing import Any
from sqlalchemy.orm import DeclarativeBase, declared_attr

class Base(DeclarativeBase):
    id: Any
    __name__: str

    # 自动将类名转为小写作为表名 (User -> user)
    @declared_attr
    def __tablename__(cls) -> str:
        return cls.__name__.lower()