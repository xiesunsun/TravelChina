from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 后面我们会把这个硬编码改为从 .env 读取
SQLALCHEMY_DATABASE_URL = "sqlite:///./huixing.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False} # SQLite 必须配置
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)