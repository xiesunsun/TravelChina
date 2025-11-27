# 前端数据存储与接口规范说明

## 1. 当前前端数据存储现状

目前前端项目采用 **纯本地存储** 模式，未连接任何后端数据库。

*   **存储方式**: `localStorage`
*   **存储键名 (Key)**: `huixing_zhonghua_records`
*   **数据格式**: JSON 序列化的 `TravelRecord[]` 数组
*   **相关文件**: `frontend/services/storageService.ts`

## 2. 前端核心数据模型 (TravelRecord)

根据 `frontend/types.ts`，当前前端使用的核心数据结构如下：

```typescript
interface TravelRecord {
  id: string;           // UUID
  city: string;         // 城市/景点名称 (用户输入)
  region?: string;      // 省份/区域名称 (地图对应)
  province?: string;    // (冗余字段，通常与 region 一致)
  date: string;         // ISO 日期字符串 (YYYY-MM-DD)
  description: string;  // 游记/随笔
  imageUrl?: string;    // 图片链接 (目前可能是 Base64 或 外部 URL)
  weather: 'sunny' | 'rainy' | 'cloudy' | 'snowy';
  timestamp: number;    // 创建时间戳 (用于排序)
}
```

## 3. 建议的后端数据库设计 (MySQL)

为了对接前端并支持多用户，建议数据库设计如下（基于 PRD 与当前代码）：

### `users` 表 (新增)
用于支持用户系统。

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | VARCHAR(36) | 主键, UUID |
| `username` | VARCHAR(50) | 用户名 |
| `password_hash` | VARCHAR(255) | 密码哈希 |
| `created_at` | TIMESTAMP | 创建时间 |

### `travel_records` 表
对应前端 `TravelRecord`，增加 `user_id` 关联。

| 字段名 | 类型 | 对应前端字段 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | `id` | 主键, UUID |
| `user_id` | VARCHAR(36) | - | 外键 -> users.id |
| `city` | VARCHAR(50) | `city` | |
| `region` | VARCHAR(50) | `region` | 省份名 |
| `date` | DATE | `date` | |
| `weather` | ENUM(...) | `weather` | sunny, rainy, cloudy, snowy |
| `description` | TEXT | `description` | |
| `image_url` | VARCHAR(500) | `imageUrl` | 图片 URL |
| `created_at` | TIMESTAMP | `timestamp` | 对应前端 timestamp (需转换) |

## 4. 需要的后端 API 接口

为了替换 `localStorage`，后端需要提供以下 RESTful 接口：

### 4.1 足迹管理 (Footprint)

*   **获取列表**
    *   `GET /api/records`
    *   **响应**: `{ code: 200, data: TravelRecord[] }`
    
*   **新增/更新足迹**
    *   `POST /api/records`
    *   **请求体**: 包含 `TravelRecord` 的所有字段（除 `id` 可选）。
    
*   **删除足迹**
    *   `DELETE /api/records/:id`

### 4.2 图片上传 (Image Upload)

前端目前可能直接存储 Base64 或需要上传图片。建议实现 OSS 上传或简单的文件上传接口。

*   **上传图片**
    *   `POST /api/upload`
    *   **Content-Type**: `multipart/form-data`
    *   **响应**: `{ code: 200, data: { url: "http://..." } }`

### 4.3 用户认证 (Auth)

*   `POST /api/auth/register`
*   `POST /api/auth/login`
*   **说明**: 登录后需返回 JWT Token，前端将在后续请求头中携带 `Authorization: Bearer <token>`。

## 5. 其他交互

*   **AI 生成**: 目前前端直接调用 Google GenAI。如果需要隐藏 API Key，可增加后端转发接口 `POST /api/ai/generate`。
