from typing import Any
from sqlalchemy.orm import DeclarativeBase, declared_attr

class Base(DeclarativeBase):
    id: Any
    __name__: str

    # 自动将类名转为小写作为表名 (User -> user)
    # 为了复数形式 (users)，我们在 model 里显式定义 __tablename__ 更好，这里做兜底
    @declared_attr
    def __tablename__(cls) -> str:
        return cls.__name__.lower()