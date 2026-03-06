# TravelChina

TravelChina 是一个旅行记录应用，包含交互式地图、足迹列表、图片上传和 AI 引导式记录流程。  
项目采用 **harness-first** 开发方式：文档、测试、CI 和可执行脚本一起作为交付物。

## 技术栈

- Frontend: React + Vite + TypeScript
- Backend: FastAPI + SQLAlchemy + Alembic + SQLite
- Auth: JWT Bearer
- E2E: Playwright
- Tooling: `uv` (Python), `npm` (Node.js)

## 仓库结构

- `frontend/`: 前端应用
- `backend/`: 后端 API、模型、迁移
- `docs/`: 规格、设计、质量文档
- `harness/`: 场景、eval、报告
- `scripts/`: 本地与 CI 使用的自动化脚本

## 环境要求

- Python `>=3.12`
- Node.js `>=20`
- `uv` 已安装

## 快速启动

### 1) 启动后端

```bash
cd backend
uv sync
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

默认会在后端启动时自动执行数据库迁移（`DB_BOOTSTRAP_ON_STARTUP=true`）。
如需手动执行迁移，可运行：

```bash
cd backend
uv run alembic upgrade head
```

后端主要环境变量（`backend/.env`）：

- `SQLALCHEMY_DATABASE_URL` (默认: `sqlite:///./huixing.db`)
- `DB_BOOTSTRAP_ON_STARTUP` (默认: `true`，设为 `false` 时不在启动阶段自动迁移)
- `ENVIRONMENT` (`development` / `staging` / `production`)
- `JWT_SECRET_KEY`
- `GEMINI_API_KEY`（可选，不配会走回退文案）
- `ALIYUN_*`（图片上传到 OSS 时需要）
- `REQUIRE_OSS_CONFIG`（默认 `false`，设为 `true` 时启动即强制校验 OSS 完整配置）
- `REQUIRE_GEMINI_API_KEY`（默认 `false`，设为 `true` 时启动即要求 `GEMINI_API_KEY`）

### 2) 启动前端

```bash
cd frontend
npm ci
npm run dev
```

可选前端环境变量：

- `VITE_API_BASE_URL`（默认: `http://localhost:8000/api/v1`）

应用启动后先在登录页注册/登录，再开始记录足迹。

## Harness 与测试

一键完整校验（本地与 CI 对齐）：

```bash
bash scripts/run-harness.sh
```

默认包含：

1. 生成工件（OpenAPI + DB schema）
2. docs lint
3. architecture lint
4. runtime config checks（离线、可复现）
5. AI eval
6. backend tests
7. frontend unit tests
8. frontend build
9. frontend e2e smoke

仅跳过 e2e：

```bash
HARNESS_SKIP_E2E=1 bash scripts/run-harness.sh
```

单独执行配置校验：

```bash
cd backend
uv run python ../scripts/validate_runtime_config.py
```

可选开关：

- `RUNTIME_VALIDATE_REQUIRE_OSS=1`：要求 OSS 配置完整，否则失败。
- `RUNTIME_VALIDATE_REQUIRE_LLM_KEY=1`：要求 `GEMINI_API_KEY` 已配置，否则失败。
- `RUNTIME_VALIDATE_ENABLE_LLM_LIVE_PROBE=1`：启用在线 LLM 探测（手动验证用）。
- `AI_EVAL_ENABLE_LIVE=1`：同时开启 AI eval 的 live 模式（默认离线）。

常用单项命令：

```bash
bash scripts/doc-lint.sh
bash scripts/architecture-lint.sh
bash scripts/generate-artifacts.sh
cd backend && uv run --with pytest pytest tests -q
cd frontend && npm test
cd frontend && npm run test:e2e
```

## Symphony Agent 工作流

- 仓库内 `WORKFLOW.md` 为 Symphony 的执行策略契约（状态流转、验证门禁、交接规则）。
- 建议从仓库根目录启动 Symphony，确保默认能读取到 `./WORKFLOW.md`。
- 工单进入 `Human Review` 前，默认必须通过 `bash scripts/run-harness.sh`。
- 每次 unattended 运行前会执行 `bash scripts/symphony-preflight.sh` 做工具/鉴权/仓库结构预检。
- 如需临时放宽 GitHub CLI 检查，可设置 `SYMPHONY_PREFLIGHT_REQUIRE_GH=0`（不建议长期使用）。

## 开发约定

- 行为变更必须同步更新 `docs/`
- 变更 PR 必须有可执行验证路径（至少本地 harness 通过）
- 新增 AI 行为需补充 `harness/evals/` 用例
- 后端路由统一使用 `/api/v1/*`

更多规则见：

- `AGENTS.md`
- `ARCHITECTURE.md`
