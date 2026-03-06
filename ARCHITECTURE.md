# TravelChina Architecture

## System Overview
- Frontend: React app renders map/list and captures user travel records.
- Backend: FastAPI API for records CRUD, AI guidance, and image upload.
- Storage: SQLite for structured records (current), OSS for image blobs.
- External AI: Gemini via backend service layer.

## Boundaries
- UI logic stays in `frontend/`.
- API and persistence logic stay in `backend/`.
- Product intent and operational policy stay in `docs/`.
- Executable quality checks stay in `harness/` and `scripts/`.

## Invariants
- Records must flow through backend APIs, not direct `localStorage` writes in app flow.
- New backend endpoints must be under `/api/v1/*`.
- AI calls must be wrapped by backend service classes.
- Every behavior-changing PR must have a runnable verification path.
- Frontend authentication must use explicit login/register flow (no silent account bootstrap).

## Runtime Contracts
- Frontend adapter maps backend schema to UI schema.
- Backend API must accept and return stable JSON contracts for records.
- Harness tests act as the regression gate for those contracts.
