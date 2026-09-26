from fastapi import APIRouter, Depends, HTTPException
from pwdlib import PasswordHash
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.shop import Shop
from app.models.user import User
from app.routes.auth import require_admin
from app.schemas.user import (
    CreateUserRequest,
    UpdateUserRequest,
    UserResponse,
)


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


password_hash = PasswordHash.recommended()


def user_to_response(
    user: User,
) -> UserResponse:
    return UserResponse(
        id=user.id,
        username=user.username,
        role=user.role,
        shop_id=user.shop_id,
        shop_name=(
            user.shop.name
            if user.shop
            else None
        ),
        is_active=user.is_active,
    )


def ensure_admin_access(
    user: User,
    current_user: User,
    db: Session,
):
    """
    Prevent the system from ending up without
    an active administrator.
    """

    # Only applies when modifying an existing ADMIN.
    if user.role != "ADMIN":
        return

    # Count currently active administrators.
    active_admin_count = db.scalar(
        select(func.count(User.id))
        .where(
            User.role == "ADMIN",
            User.is_active.is_(True),
        )
    )

    # Never allow the final active admin
    # to lose admin access.
    if active_admin_count == 1:
        raise HTTPException(
            status_code=400,
            detail=(
                "The last active administrator "
                "cannot be removed, demoted, or deactivated."
            ),
        )


@router.get(
    "",
    response_model=list[UserResponse],
)
def get_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = db.scalars(
        select(User)
        .order_by(User.id)
    ).all()

    return [
        user_to_response(user)
        for user in users
    ]


@router.get(
    "/{user_id}",
    response_model=UserResponse,
)
def get_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.get(
        User,
        user_id,
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    return user_to_response(user)


@router.post(
    "",
    response_model=UserResponse,
    status_code=201,
)
def create_user(
    data: CreateUserRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    username = data.username.strip()

    if not username:
        raise HTTPException(
            status_code=400,
            detail="Username cannot be empty.",
        )

    role = data.role.strip().upper()

    if role not in {
        "ADMIN",
        "CASHIER",
    }:
        raise HTTPException(
            status_code=400,
            detail="Role must be ADMIN or CASHIER.",
        )

    if role == "CASHIER" and data.shop_id is None:
        raise HTTPException(
            status_code=400,
            detail="Cashier must be assigned to a shop.",
        )

    if role == "ADMIN":
        shop_id = None
    else:
        shop_id = data.shop_id

    existing_user = db.scalar(
        select(User).where(
            User.username == username
        )
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Username already exists.",
        )

    if shop_id is not None:
        shop = db.get(
            Shop,
            shop_id,
        )

        if not shop:
            raise HTTPException(
                status_code=404,
                detail="Shop not found.",
            )

    user = User(
        username=username,
        password_hash=password_hash.hash(
            data.password
        ),
        role=role,
        shop_id=shop_id,
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user_to_response(user)


@router.put(
    "/{user_id}",
    response_model=UserResponse,
)
def update_user(
    user_id: int,
    data: UpdateUserRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.get(
        User,
        user_id,
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    requested_role = None

    if data.role is not None:
        requested_role = (
            data.role.strip().upper()
        )

        if requested_role not in {
            "ADMIN",
            "CASHIER",
        }:
            raise HTTPException(
                status_code=400,
                detail="Role must be ADMIN or CASHIER.",
            )

    # Protect the currently logged-in admin.
    if user.id == current_user.id:

        if requested_role is not None:
            if requested_role != "ADMIN":
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "You cannot remove your own "
                        "admin role."
                    ),
                )

        if data.is_active is False:
            raise HTTPException(
                status_code=400,
                detail=(
                    "You cannot deactivate "
                    "your own account."
                ),
            )

    # Protect the last active administrator.
    if user.role == "ADMIN":
        role_will_change_to_cashier = (
            requested_role == "CASHIER"
        )

        account_will_be_deactivated = (
            data.is_active is False
        )

        if (
            role_will_change_to_cashier
            or account_will_be_deactivated
        ):
            ensure_admin_access(
                user,
                current_user,
                db,
            )

    if data.username is not None:
        username = data.username.strip()

        if not username:
            raise HTTPException(
                status_code=400,
                detail="Username cannot be empty.",
            )

        existing_user = db.scalar(
            select(User).where(
                User.username == username,
                User.id != user_id,
            )
        )

        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="Username already exists.",
            )

        user.username = username

    if data.password is not None:
        user.password_hash = password_hash.hash(
            data.password
        )

    if requested_role is not None:
        user.role = requested_role

    # ADMIN accounts never belong to a shop.
    if user.role == "ADMIN":
        user.shop_id = None

    else:
        # CASHIER must always belong to a shop.
        if (
            data.shop_id is None
            and user.shop_id is None
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Cashier must be assigned "
                    "to a shop."
                ),
            )

        if data.shop_id is not None:
            shop = db.get(
                Shop,
                data.shop_id,
            )

            if not shop:
                raise HTTPException(
                    status_code=404,
                    detail="Shop not found.",
                )

            user.shop_id = data.shop_id

    if data.is_active is not None:
        user.is_active = data.is_active

    # Final safety check.
    if (
        user.role == "CASHIER"
        and user.shop_id is None
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Cashier must be assigned "
                "to a shop."
            ),
        )

    db.commit()
    db.refresh(user)

    return user_to_response(user)


@router.delete(
    "/{user_id}",
)
def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.get(
        User,
        user_id,
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own account.",
        )

    # Never allow deletion of the last active admin.
    if user.role == "ADMIN":
        ensure_admin_access(
            user,
            current_user,
            db,
        )

    db.delete(user)
    db.commit()

    return {
        "success": True,
        "message": "User deleted successfully.",
    }