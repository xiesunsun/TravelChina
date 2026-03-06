# Harness V0 Design

## Goal
Create a minimum harness that makes changes verifiable, repeatable, and CI-friendly.

## Scope
- Structured docs and architecture baseline.
- Backend API contract tests for records CRUD.
- One command local harness runner.
- CI workflow that enforces docs + backend tests + frontend unit/build + frontend e2e smoke.

## Out Of Scope (V0)
- AI quality scoring beyond deterministic fallback checks.
- Performance/load testing.

## Success Criteria
- `bash scripts/run-harness.sh` passes locally.
- CI workflow passes on pull requests.
- No new drift between docs and implementation for touched behavior.
