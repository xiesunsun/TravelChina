#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

required=(
  "AGENTS.md"
  "ARCHITECTURE.md"
  "docs/index.md"
  "docs/design-docs/harness-v0.md"
  "docs/product-specs/index.md"
  "docs/exec-plans/active/harness-v0-rollout.md"
  "docs/QUALITY_SCORE.md"
  "docs/RELIABILITY.md"
  "docs/SECURITY.md"
  "harness/README.md"
)

for file in "${required[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "[doc-lint] Missing required file: $file"
    exit 1
  fi
done

contains() {
  local pattern="$1"
  local file="$2"
  if command -v rg >/dev/null 2>&1; then
    rg -q "$pattern" "$file"
  else
    grep -q "$pattern" "$file"
  fi
}

if ! contains "harness" AGENTS.md; then
  echo "[doc-lint] AGENTS.md must mention harness workflow"
  exit 1
fi

if ! contains "Invariants" ARCHITECTURE.md; then
  echo "[doc-lint] ARCHITECTURE.md must contain invariants section"
  exit 1
fi

echo "[doc-lint] OK"
