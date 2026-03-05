from pathlib import Path
import sys
from typing import Generator

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.v1.endpoints import records
from app.db.base import Base
from app.main import app
from app.models.user import User

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_harness.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db() -> Generator:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def reset_db() -> Generator:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    db.add(User(id="test-user", username="tester", hashed_password="not-used"))
    db.commit()
    db.close()
    yield


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    app.dependency_overrides[records.get_db] = override_get_db
    app.dependency_overrides[records.get_fake_user] = lambda: "test-user"

    with TestClient(app) as api_client:
        yield api_client

    app.dependency_overrides.clear()
