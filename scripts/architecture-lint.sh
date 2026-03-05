#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

main_file="backend/app/main.py"
records_file="backend/app/api/v1/endpoints/records.py"
ai_file="backend/app/api/v1/endpoints/ai.py"

if grep "include_router" "$main_file" | grep -v '/api/v1/' >/dev/null; then
  echo "[arch-lint] All routers in main.py must use /api/v1/* prefix"
  exit 1
fi

contains() {
  local pattern="$1"
  local path="$2"
  if command -v rg >/dev/null 2>&1; then
    rg -q "$pattern" "$path"
  else
    grep -R -q "$pattern" "$path"
  fi
}

if contains "get_fake_user" backend/app; then
  echo "[arch-lint] Fake user dependency must not exist in backend app"
  exit 1
fi

if ! grep -q "Depends(get_current_user)" "$records_file"; then
  echo "[arch-lint] Records endpoints must depend on get_current_user"
  exit 1
fi

if ! grep -q "from app.services.ai_service import AIService" "$ai_file"; then
  echo "[arch-lint] AI endpoint must call AIService wrapper"
  exit 1
fi

if command -v rg >/dev/null 2>&1; then
  if rg -n "storageService" frontend --glob '!frontend/services/storageService.ts' >/dev/null 2>&1; then
    echo "[arch-lint] storageService must not be used in active frontend app flow"
    exit 1
  fi
elif grep -R -n "storageService" frontend | grep -v "frontend/services/storageService.ts" >/dev/null 2>&1; then
  echo "[arch-lint] storageService must not be used in active frontend app flow"
  exit 1
fi

echo "[arch-lint] OK"
