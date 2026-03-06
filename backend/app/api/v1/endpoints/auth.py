import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.bootstrap import MIGRATION_GUIDANCE, is_missing_users_table_error
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserRead


router = APIRouter()


def _raise_if_missing_users_table(exc: OperationalError) -> None:
    if is_missing_users_table_error(exc):
        raise HTTPException(status_code=503, detail=MIGRATION_GUIDANCE) from exc
    raise exc


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    try:
        existing = db.query(User).filter(User.username == payload.username).first()
    except OperationalError as exc:
        _raise_if_missing_users_table(exc)
    if existing:
        raise HTTPException(status_code=409, detail="Username already exists")

    user = User(
        id=str(uuid.uuid4()),
        username=payload.username,
        hashed_password=get_password_hash(payload.password),
        is_active=True,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Username already exists") from exc
    except OperationalError as exc:
        db.rollback()
        _raise_if_missing_users_table(exc)
    db.refresh(user)
    return UserRead(id=user.id, username=user.username)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.username == payload.username).first()
    except OperationalError as exc:
        _raise_if_missing_users_table(exc)
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(subject=user.username)
    return TokenResponse(access_token=token)
