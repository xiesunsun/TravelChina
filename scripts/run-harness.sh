#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[harness] 1/9 generate artifacts"
bash scripts/generate-artifacts.sh

echo "[harness] 2/9 docs checks"
bash scripts/doc-lint.sh

echo "[harness] 3/9 architecture checks"
bash scripts/architecture-lint.sh

echo "[harness] 4/9 runtime config checks"
(
  cd backend
  RUNTIME_VALIDATE_REQUIRE_OSS="${RUNTIME_VALIDATE_REQUIRE_OSS:-0}" \
  RUNTIME_VALIDATE_REQUIRE_LLM_KEY="${RUNTIME_VALIDATE_REQUIRE_LLM_KEY:-0}" \
  RUNTIME_VALIDATE_ENABLE_LLM_LIVE_PROBE="${RUNTIME_VALIDATE_ENABLE_LLM_LIVE_PROBE:-${AI_EVAL_ENABLE_LIVE:-0}}" \
  uv run python ../scripts/validate_runtime_config.py
)

echo "[harness] 5/9 ai evals"
(
  cd backend
  uv run python ../scripts/run_ai_evals.py
)

echo "[harness] 6/9 backend contract tests"
(
  cd backend
  uv run --with pytest pytest tests -q
)

echo "[harness] 7/9 frontend tests"
(
  cd frontend
  npm test
)

echo "[harness] 8/9 frontend build"
(
  cd frontend
  npm run build
)

echo "[harness] 9/9 frontend e2e smoke"
if [[ "${HARNESS_SKIP_E2E:-0}" == "1" ]]; then
  echo "[harness] skipped e2e smoke (HARNESS_SKIP_E2E=1)"
else
  (
    cd frontend
    npm run test:e2e
  )
fi

echo "[harness] PASS"
