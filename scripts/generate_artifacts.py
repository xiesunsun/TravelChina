#!/usr/bin/env python3
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
GENERATED_DIR = ROOT / "docs" / "generated"

sys.path.insert(0, str(BACKEND_DIR))

from app.db.base import Base  # noqa: E402
from app.main import app  # noqa: E402


def render_db_schema() -> str:
    lines = ["# DB Schema", "", "Generated from SQLAlchemy metadata.", ""]

    for table in sorted(Base.metadata.tables.values(), key=lambda t: t.name):
        lines.append(f"## {table.name}")
        lines.append("")
        lines.append("| Column | Type | Nullable |")
        lines.append("|---|---|---|")
        for col in table.columns:
            lines.append(f"| {col.name} | {col.type} | {col.nullable} |")
        lines.append("")

    return "\n".join(lines)


def main() -> int:
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)

    openapi_path = GENERATED_DIR / "openapi.json"
    db_schema_path = GENERATED_DIR / "db-schema.md"

    openapi_path.write_text(
        json.dumps(app.openapi(), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    db_schema_path.write_text(render_db_schema(), encoding="utf-8")

    print(f"[generate] wrote {openapi_path}")
    print(f"[generate] wrote {db_schema_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
