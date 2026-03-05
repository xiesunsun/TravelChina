# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import records
from app.api.v1.endpoints import upload
from app.api.v1.endpoints import ai
from app.api.v1.endpoints import auth
app = FastAPI(title="Huixing Zhonghua API")

# --- CORS 配置 (关键！解决前端跨域问题) ---
# 允许前端 http://localhost:5173 访问后端
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 注册路由 ---
app.include_router(records.router, prefix="/api/v1/records", tags=["records"])
app.include_router(upload.router, prefix="/api/v1/upload", tags=["upload"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
@app.get("/")
def root():
    return {"message": "Hello from Huixing Backend!"}
