from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.shop import Shop
from app.models.user import User
from app.routes.auth import get_current_user, require_admin
from app.schemas.shop import (
    ShopCreate,
    ShopResponse,
    ShopUpdate,
)


router = APIRouter(
    prefix="/shops",
    tags=["Shops"],
)


@router.get(
    "",
    response_model=list[ShopResponse],
)
def get_shops(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # ADMIN can see every shop.
    if current_user.role == "ADMIN":
        return (
            db.query(Shop)
            .order_by(Shop.id)
            .all()
        )

    # CASHIER can only see their assigned shop.
    if current_user.shop_id is None:
        return []

    shop = (
        db.query(Shop)
        .filter(
            Shop.id == current_user.shop_id
        )
        .first()
    )

    if shop is None:
        return []

    return [shop]


@router.get(
    "/{shop_id}",
    response_model=ShopResponse,
)
def get_shop(
    shop_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    shop = (
        db.query(Shop)
        .filter(Shop.id == shop_id)
        .first()
    )

    if shop is None:
        raise HTTPException(
            status_code=404,
            detail="Shop not found",
        )

    # ADMIN can access any shop.
    if current_user.role == "ADMIN":
        return shop

    # CASHIER can only access their assigned shop.
    if current_user.shop_id != shop.id:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this shop.",
        )

    return shop


@router.post(
    "",
    response_model=ShopResponse,
    status_code=201,
)
def create_shop(
    shop_data: ShopCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    new_shop = Shop(
        name=shop_data.name,
        location=shop_data.location,
        status="Open",
    )

    db.add(new_shop)
    db.commit()
    db.refresh(new_shop)

    return new_shop


@router.put(
    "/{shop_id}",
    response_model=ShopResponse,
)
def update_shop(
    shop_id: int,
    shop_data: ShopUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    shop = (
        db.query(Shop)
        .filter(Shop.id == shop_id)
        .first()
    )

    if shop is None:
        raise HTTPException(
            status_code=404,
            detail="Shop not found",
        )

    update_data = shop_data.model_dump(
        exclude_unset=True,
        exclude_none=True,
    )

    for key, value in update_data.items():
        setattr(shop, key, value)

    db.commit()
    db.refresh(shop)

    return shop


@router.delete(
    "/{shop_id}",
)
def delete_shop(
    shop_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    shop = (
        db.query(Shop)
        .filter(Shop.id == shop_id)
        .first()
    )

    if shop is None:
        raise HTTPException(
            status_code=404,
            detail="Shop not found",
        )

    db.delete(shop)
    db.commit()

    return {
        "message": "Shop deleted successfully",
        "shop_id": shop_id,
    }