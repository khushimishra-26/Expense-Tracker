import os
from logging.config import fileConfig

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, pool
from alembic import context

from database import Base
import models

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not found in environment")

config.set_main_option(
    "sqlalchemy.url",
    DATABASE_URL.replace("%", "%%")
)


def run_migrations_offline():
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connect_args = (
        {"check_same_thread": False}
        if DATABASE_URL.startswith("sqlite")
        else {}
    )

    connectable = create_engine(
        DATABASE_URL,
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()

    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

