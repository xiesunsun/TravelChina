# Reliability Notes

## Current Guardrails
- Backend CRUD contract tests.
- Backend auth and ai/upload API tests.
- Runtime config validator (`scripts/validate_runtime_config.py`) with deterministic offline checks.
- AI eval runner with deterministic offline assertions and scored report output.
- Frontend unit tests (adapter contract).
- Frontend Playwright e2e smoke flow (create -> list -> delete).
- Frontend production build check.
- Symphony unattended preflight check (`scripts/symphony-preflight.sh`) before each run attempt.
- CI must pass docs/arch checks, backend tests, frontend tests/build, and e2e smoke.

## AI Eval Policy
- CI defaults to offline deterministic checks to avoid quota/network flakiness.
- Optional live AI probe can be enabled via `RUNTIME_VALIDATE_ENABLE_LLM_LIVE_PROBE=1` or `AI_EVAL_ENABLE_LIVE=1` for manual confidence runs.

## Config Validation Policy
- OSS config is validated for completeness/format with fail-fast errors.
- Startup enforces config guardrails via `validate_runtime_configuration()`.
- Harness/preflight share the same validator for local/CI consistency.
- Strict mode can be enabled with:
  - `RUNTIME_VALIDATE_REQUIRE_OSS=1`
  - `RUNTIME_VALIDATE_REQUIRE_LLM_KEY=1`

## Known Reliability Gaps
- No retry policy around third-party AI/OSS calls.
- No seeded integration environment in CI.

## Immediate Next Step
Add retry/backoff policy and timeout budgets for AI/OSS calls with observable error metrics.
