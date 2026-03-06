#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[harness] 1/8 generate artifacts"
bash scripts/generate-artifacts.sh

echo "[harness] 2/8 docs checks"
bash scripts/doc-lint.sh

echo "[harness] 3/8 architecture checks"
bash scripts/architecture-lint.sh

echo "[harness] 4/8 ai evals"
(
  cd backend
  uv run python ../scripts/run_ai_evals.py
)

echo "[harness] 5/8 backend contract tests"
(
  cd backend
  uv run --with pytest pytest tests -q
)

echo "[harness] 6/8 frontend tests"
(
  cd frontend
  npm test
)

echo "[harness] 7/8 frontend build"
(
  cd frontend
  npm run build
)

echo "[harness] 8/8 frontend e2e smoke"
if [[ "${HARNESS_SKIP_E2E:-0}" == "1" ]]; then
  echo "[harness] skipped e2e smoke (HARNESS_SKIP_E2E=1)"
else
  (
    cd frontend
    npm run test:e2e
  )
fi

echo "[harness] PASS"
