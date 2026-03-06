#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/backend"

export SQLALCHEMY_DATABASE_URL="${SQLALCHEMY_DATABASE_URL:-sqlite:///./e2e.db}"

if [[ "$SQLALCHEMY_DATABASE_URL" == "sqlite:///./e2e.db" ]]; then
  rm -f e2e.db
fi

uv run alembic upgrade head

exec uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
