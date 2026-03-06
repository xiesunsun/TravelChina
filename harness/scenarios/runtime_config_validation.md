# Scenario: Runtime Config Validation

## Preconditions
- Backend dependencies are installable via `uv`.
- No external network dependency is required for offline path.

## Steps
1. Run `cd backend && uv run python ../scripts/validate_runtime_config.py`.
2. Confirm offline fallback check is deterministic and script exits 0 by default.
3. Run with strict OSS check:
   `cd backend && RUNTIME_VALIDATE_REQUIRE_OSS=1 uv run python ../scripts/validate_runtime_config.py`.
4. Run with strict LLM key check:
   `cd backend && RUNTIME_VALIDATE_REQUIRE_LLM_KEY=1 uv run python ../scripts/validate_runtime_config.py`.
5. (Manual only) Enable live LLM probe:
   `cd backend && RUNTIME_VALIDATE_ENABLE_LLM_LIVE_PROBE=1 uv run python ../scripts/validate_runtime_config.py`.

## Expected
- Default mode is offline-only and deterministic.
- Strict OSS/LLM modes fail fast with readable, actionable error messages.
- Live probe runs only when explicitly enabled.
