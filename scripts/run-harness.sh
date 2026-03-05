#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[harness] 1/7 generate artifacts"
bash scripts/generate-artifacts.sh

echo "[harness] 2/7 docs checks"
bash scripts/doc-lint.sh

echo "[harness] 3/7 architecture checks"
bash scripts/architecture-lint.sh

echo "[harness] 4/7 ai evals"
(
  cd backend
  uv run python ../scripts/run_ai_evals.py
)

echo "[harness] 5/7 backend contract tests"
(
  cd backend
  uv run --with pytest pytest tests -q
)

echo "[harness] 6/7 frontend tests"
(
  cd frontend
  npm test
)

echo "[harness] 7/7 frontend build"
(
  cd frontend
  npm run build
)

echo "[harness] PASS"
