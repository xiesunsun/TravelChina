# Harness Directory

- `scenarios/`: human-readable acceptance scenarios.
- `evals/`: machine-readable eval inputs for AI-related behavior.
- `fixtures/`: reusable payload fixtures.
- `reports/`: run outputs (kept lightweight in git).

Run all v0 checks with:
- `bash scripts/run-harness.sh`

AI eval notes:
- Default mode is deterministic offline assertions (no external model dependency).
- Optional live probe can be enabled with `AI_EVAL_ENABLE_LIVE=1`.
