# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import records
from app.api.v1.endpoints import upload
app = FastAPI(title="Huixing Zhonghua API")

# --- CORS 配置 (关键！解决前端跨域问题) ---
# 允许前端 http://localhost:5173 访问后端
origins = [
    "http://localhost:5173", # Vite 默认端口
    "http://localhost:3000",
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
@app.get("/")
def root():
    return {"message": "Hello from Huixing Backend!"}