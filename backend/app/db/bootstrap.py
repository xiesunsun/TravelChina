from pathlib import Path

from alembic import command
from alembic.config import Config

from app.core.config import settings


MIGRATION_GUIDANCE = (
    "Database schema is not initialized. Run `cd backend && uv run alembic upgrade head` "
    "or keep `DB_BOOTSTRAP_ON_STARTUP=true`."
)


def bootstrap_database() -> None:
    backend_dir = Path(__file__).resolve().parents[2]
    alembic_ini = backend_dir / "alembic.ini"
    alembic_dir = backend_dir / "alembic"

    config = Config(str(alembic_ini))
    config.set_main_option("script_location", str(alembic_dir))
    config.set_main_option("sqlalchemy.url", settings.SQLALCHEMY_DATABASE_URL)
    command.upgrade(config, "head")


def is_missing_users_table_error(exc: Exception) -> bool:
    detail = str(getattr(exc, "orig", exc)).lower()
    return "no such table: users" in detail
