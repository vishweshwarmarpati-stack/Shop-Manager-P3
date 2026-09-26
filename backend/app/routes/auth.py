import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pwdlib import PasswordHash
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User


load_dotenv()


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


security = HTTPBearer()
password_hash = PasswordHash.recommended()

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 8


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    access_token: str
    token_type: str
    username: str
    role: str
    shop_id: int | None
    message: str


class CurrentUserResponse(BaseModel):
    id: int
    username: str
    role: str
    shop_id: int | None
    is_active: bool


def create_access_token(user: User) -> str:
    secret_key = os.getenv("JWT_SECRET_KEY")

    if not secret_key:
        raise RuntimeError(
            "JWT_SECRET_KEY is not configured on the server."
        )

    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user.id),
        "username": user.username,
        "role": user.role,
        "shop_id": user.shop_id,
        "iat": now,
        "exp": now + timedelta(
            minutes=JWT_EXPIRE_MINUTES
        ),
    }

    return jwt.encode(
        payload,
        secret_key,
        algorithm=JWT_ALGORITHM,
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    secret_key = os.getenv("JWT_SECRET_KEY")

    if not secret_key:
        raise HTTPException(
            status_code=500,
            detail="JWT secret is not configured.",
        )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            secret_key,
            algorithms=[JWT_ALGORITHM],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Authentication token has expired.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
        )

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
        )

    user = db.get(User, user_id)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User account no longer exists.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive.",
        )

    return user


def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )

    return current_user


@router.post(
    "/login",
    response_model=LoginResponse,
)
def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db),
):
    username = credentials.username.strip()

    user = db.scalar(
        select(User).where(
            User.username == username
        )
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive.",
        )

    if not password_hash.verify(
        credentials.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password.",
        )

    access_token = create_access_token(user)

    return LoginResponse(
        success=True,
        access_token=access_token,
        token_type="bearer",
        username=user.username,
        role=user.role,
        shop_id=user.shop_id,
        message="Login successful.",
    )


@router.get(
    "/me",
    response_model=CurrentUserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return CurrentUserResponse(
        id=current_user.id,
        username=current_user.username,
        role=current_user.role,
        shop_id=current_user.shop_id,
        is_active=current_user.is_active,
    )