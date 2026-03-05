# Reliability Notes

## Current Guardrails
- Backend CRUD contract tests.
- Backend auth and ai/upload API tests.
- AI eval runner with scored report output.
- Frontend unit tests (adapter contract).
- Frontend production build check.
- CI must pass docs check, backend tests, frontend build.

## Known Reliability Gaps
- No frontend end-to-end flow verification yet.
- No retry policy around third-party AI/OSS calls.
- No seeded integration environment in CI.

## Immediate Next Step
Add one Playwright smoke scenario: create record -> list record -> delete record.
