from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product
from app.models.shop import Shop
from app.models.user import User
from app.routes.auth import get_current_user, require_admin
from app.schemas.product import (
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)


router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


def ensure_product_access(
    product: Product,
    current_user: User,
):
    if current_user.role == "ADMIN":
        return

    if current_user.shop_id != product.shop_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this product.",
        )


@router.get(
    "/debug/database",
)
def debug_database(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    shops = (
        db.execute(
            text(
                "SELECT id, name, location, status "
                "FROM shops ORDER BY id"
            )
        )
        .mappings()
        .all()
    )

    return {
        "shops_seen_by_product_route": [
            dict(shop) for shop in shops
        ],
        "shop_count": len(shops),
    }


@router.get(
    "",
    response_model=list[ProductResponse],
)
def get_products(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Product)

    if current_user.role != "ADMIN":
        query = query.filter(
            Product.shop_id == current_user.shop_id
        )

    return (
        query
        .order_by(Product.id)
        .all()
    )


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
)
def get_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    ensure_product_access(
        product,
        current_user,
    )

    return product


@router.post(
    "",
    response_model=ProductResponse,
    status_code=201,
)
def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if (
        current_user.role != "ADMIN"
        and product_data.shop_id != current_user.shop_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only create products for your assigned shop.",
        )

    shop = db.get(
        Shop,
        product_data.shop_id,
    )

    if shop is None:
        raise HTTPException(
            status_code=404,
            detail="Shop not found",
        )

    new_product = Product(
        name=product_data.name,
        price=product_data.price,
        category=product_data.category,
        shop_id=shop.id,
        image=product_data.image,
        is_active=product_data.is_active,
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    ensure_product_access(
        product,
        current_user,
    )

    update_data = product_data.model_dump(
        exclude_unset=True,
    )

    if "shop_id" in update_data:
        new_shop_id = update_data["shop_id"]

        shop = db.get(
            Shop,
            new_shop_id,
        )

        if shop is None:
            raise HTTPException(
                status_code=404,
                detail="Shop not found",
            )

        if (
            current_user.role != "ADMIN"
            and new_shop_id != current_user.shop_id
        ):
            raise HTTPException(
                status_code=403,
                detail="You cannot move a product to another shop.",
            )

    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)

    return product


@router.delete(
    "/{product_id}",
)
def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    ensure_product_access(
        product,
        current_user,
    )

    try:
        db.delete(product)
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "This product is used in previous orders "
                "and cannot be permanently deleted. "
                "Deactivate the product instead."
            ),
        )

    return {
        "message": "Product deleted successfully",
        "product_id": product_id,
    }


@router.patch(
    "/{product_id}/status",
    response_model=ProductResponse,
)
def update_product_status(
    product_id: int,
    is_active: bool,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    ensure_product_access(
        product,
        current_user,
    )

    product.is_active = is_active

    db.commit()
    db.refresh(product)

    return product