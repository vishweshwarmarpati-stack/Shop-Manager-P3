from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.shop import Shop
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse
from app.routes.auth import get_current_user


router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)


def ensure_order_access(
    order: Order,
    current_user: User,
) -> None:
    if current_user.role == "ADMIN":
        return

    if current_user.role != "CASHIER":
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to access orders.",
        )

    if current_user.shop_id is None:
        raise HTTPException(
            status_code=403,
            detail="Your account is not assigned to a shop.",
        )

    if order.shop_id != current_user.shop_id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to access this order.",
        )


def ensure_shop_access(
    shop_id: int,
    current_user: User,
) -> None:
    if current_user.role == "ADMIN":
        return

    if current_user.role != "CASHIER":
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to create orders.",
        )

    if current_user.shop_id is None:
        raise HTTPException(
            status_code=403,
            detail="Your account is not assigned to a shop.",
        )

    if shop_id != current_user.shop_id:
        raise HTTPException(
            status_code=403,
            detail="You can only create orders for your assigned shop.",
        )


@router.get(
    "",
    response_model=list[OrderResponse],
)
def get_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    statement = (
        select(Order)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    )

    if current_user.role != "ADMIN":
        if current_user.role != "CASHIER":
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to access orders.",
            )

        if current_user.shop_id is None:
            raise HTTPException(
                status_code=403,
                detail="Your account is not assigned to a shop.",
            )

        statement = statement.where(
            Order.shop_id == current_user.shop_id
        )

    orders = db.scalars(statement).all()

    return orders


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    statement = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )

    order = db.scalar(statement)

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found.",
        )

    ensure_order_access(
        order,
        current_user,
    )

    return order


@router.post(
    "",
    response_model=OrderResponse,
    status_code=201,
)
def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_shop_access(
        order_data.shop_id,
        current_user,
    )

    shop = db.get(
        Shop,
        order_data.shop_id,
    )

    if shop is None:
        raise HTTPException(
            status_code=404,
            detail="Shop not found.",
        )

    if not order_data.items:
        raise HTTPException(
            status_code=400,
            detail="Order must contain at least one item.",
        )

    order = Order(
        shop_id=order_data.shop_id,
        total=order_data.total,
        payment_method=order_data.payment_method,
    )

    db.add(order)

    for item_data in order_data.items:
        product = db.get(
            Product,
            item_data.product_id,
        )

        if product is None:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Product {item_data.product_id} "
                    "not found."
                ),
            )

        if product.shop_id != order_data.shop_id:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Product {item_data.product_id} "
                    "does not belong to this shop."
                ),
            )

        order_item = OrderItem(
            product_id=item_data.product_id,
            product_name=item_data.product_name,
            price=item_data.price,
            quantity=item_data.quantity,
            subtotal=item_data.subtotal,
        )

        order.items.append(order_item)

    db.commit()

    db.refresh(order)

    statement = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order.id)
    )

    order = db.scalar(statement)

    return order


@router.delete(
    "/{order_id}",
)
def delete_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.get(
        Order,
        order_id,
    )

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found.",
        )

    ensure_order_access(
        order,
        current_user,
    )

    db.delete(order)
    db.commit()

    return {
        "message": "Order deleted successfully.",
    }