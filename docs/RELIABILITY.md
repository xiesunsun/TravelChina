# Reliability Notes

## Current Guardrails
- Backend CRUD contract tests.
- Backend auth and ai/upload API tests.
- AI eval runner with scored report output.
- Frontend unit tests (adapter contract).
- Frontend Playwright e2e smoke flow (create -> list -> delete).
- Frontend production build check.
- CI must pass docs/arch checks, backend tests, frontend tests/build, and e2e smoke.

## Known Reliability Gaps
- No retry policy around third-party AI/OSS calls.
- No seeded integration environment in CI.

## Immediate Next Step
Add one Playwright smoke scenario: create record -> list record -> delete record.
