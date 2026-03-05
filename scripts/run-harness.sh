#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[harness] 1/3 docs checks"
bash scripts/doc-lint.sh

echo "[harness] 2/3 backend contract tests"
(
  cd backend
  uv run --with pytest pytest tests -q
)

echo "[harness] 3/3 frontend build"
(
  cd frontend
  npm run build
)

echo "[harness] PASS"
