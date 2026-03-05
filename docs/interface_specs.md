# 前后端接口规范说明（2026-03-05）

## 1. 当前实现状态

当前项目已完成从纯前端本地存储向后端 API 的迁移，核心数据读写通过 FastAPI 服务完成。

- 前端记录流：`frontend/services/apiService.ts`
- 后端接口前缀：`/api/v1/*`
- 鉴权方式：JWT Bearer Token
- 数据库：SQLite（SQLAlchemy + Alembic）
- 前端 API 基址：`VITE_API_BASE_URL`（未设置时默认 `http://localhost:8000/api/v1`）

## 2. 前端核心数据模型（TravelRecord）

```typescript
interface TravelRecord {
  id: string;
  city: string;
  region?: string;
  province?: string;
  date: string; // YYYY-MM-DD
  description: string;
  imageUrl?: string;
  images?: string[];
  spot_name?: string;
  weather: 'sunny' | 'rainy' | 'cloudy' | 'snowy' | 'unknown';
  timestamp: number;
}
```

## 3. 后端数据模型（核心字段）

`travel_records`
- `id` (PK)
- `user_id` (FK -> users.id)
- `province`
- `city`
- `spot_name`
- `travel_date`
- `weather`
- `thoughts`
- `images` (JSON)
- `created_at`
- `updated_at`

`users`
- `id` (PK)
- `username` (unique)
- `hashed_password`
- `is_active`
- `created_at`

## 4. API 接口（当前）

### 4.1 鉴权
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

登录成功后返回：
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

### 4.2 足迹记录
- `GET /api/v1/records/`
- `POST /api/v1/records/`
- `PUT /api/v1/records/{record_id}`
- `DELETE /api/v1/records/{record_id}`

以上接口需要 `Authorization: Bearer <token>`。

### 4.3 AI 辅助
- `POST /api/v1/ai/chat`
- `POST /api/v1/ai/resolve_location`

### 4.4 上传
- `POST /api/v1/upload/` (`multipart/form-data`)

## 5. 契约稳定性策略

- 前端与后端字段映射统一由 `frontend/services/recordAdapter.ts` 处理。
- 后端契约由 `backend/tests/` 回归测试保障。
- AI eval 样例保存在 `harness/evals/`，每次 harness 执行都会产出报告到 `harness/reports/`。
