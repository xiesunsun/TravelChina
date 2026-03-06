# Harness Directory

- `scenarios/`: human-readable acceptance scenarios.
- `evals/`: machine-readable eval inputs for AI-related behavior.
- `fixtures/`: reusable payload fixtures.
- `reports/`: run outputs (kept lightweight in git).

Auth regression assets:
- `scenarios/auth_validation.md`: auth input validation and readable error scenario.
- `evals/auth_validation_eval.jsonl`: machine-readable auth regression cases.

Run all v0 checks with:
- `bash scripts/run-harness.sh`

Runtime config validation:
- `cd backend && uv run python ../scripts/validate_runtime_config.py`
- Strict OSS requirement: `RUNTIME_VALIDATE_REQUIRE_OSS=1`
- Strict LLM key requirement: `RUNTIME_VALIDATE_REQUIRE_LLM_KEY=1`

AI eval notes:
- Default mode is deterministic offline assertions (no external model dependency).
- Optional live probe can be enabled with `AI_EVAL_ENABLE_LIVE=1` (or `RUNTIME_VALIDATE_ENABLE_LLM_LIVE_PROBE=1`).
