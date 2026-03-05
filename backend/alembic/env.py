import sys
from os.path import abspath, dirname
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# ---------------------------------------------------------
# 【修改 1】把当前项目路径加入系统路径，否则找不到 app 模块
# ---------------------------------------------------------
# 这行代码的意思是：把 alembic 文件夹的上一级 (即 backend) 加入 Python 搜索路径
sys.path.insert(0, dirname(dirname(abspath(__file__))))

# ---------------------------------------------------------
# 【修改 2】导入你的 Base (包含所有 Models)
# ---------------------------------------------------------
from app.db.base import Base  # 这是我们在 app/db/base.py 里定义的

# this is the Alembic Config object.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ---------------------------------------------------------
# 【修改 3】设置 target_metadata
# ---------------------------------------------------------
# 告诉 Alembic 对比这个 metadata 和数据库的区别
target_metadata = Base.metadata

# ... 后面的代码保持默认即可 (run_migrations_offline 和 run_migrations_online) ...

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
