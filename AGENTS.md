# TravelChina Agent Guide

This repository is managed in a harness-first way.

## Repo Map
- `frontend/`: React + Vite user interface.
- `backend/`: FastAPI service, DB models, Alembic migrations.
- `docs/`: specs, design docs, execution plans, quality docs.
- `harness/`: executable scenarios, eval inputs, and reports.
- `scripts/`: local automation used by people and CI.

## Golden Commands
- `bash scripts/run-harness.sh`: run v0 harness end-to-end.
- `bash scripts/doc-lint.sh`: validate required docs and structure.
- `bash scripts/generate-artifacts.sh`: regenerate OpenAPI and DB schema docs.
- `cd backend && uv run --with pytest pytest tests -q`: backend contract tests.
- `cd frontend && npm test`: frontend unit tests.
- `cd frontend && npm run build`: frontend production build check.

## Definition Of Done
- Behavior is documented in `docs/` before merge.
- Harness checks are green locally and in CI.
- Architecture invariants in `ARCHITECTURE.md` are preserved.
- New AI behavior has at least one reproducible eval case in `harness/evals/`.
