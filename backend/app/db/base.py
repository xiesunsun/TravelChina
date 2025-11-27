# backend/app/db/base.py

# 1. 从 base_class 导入 Base (这句最重要，你可能漏了或者写错了)
from app.db.base_class import Base

# 2. 导入所有的 Models (为了让 Alembic 能发现它们)
from app.models.user import User
from app.models.record import TravelRecord