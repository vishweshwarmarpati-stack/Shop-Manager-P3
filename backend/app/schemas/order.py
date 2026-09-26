from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class OrderItemCreate(BaseModel):
    product_id: int
    product_name: str
    price: Decimal
    quantity: int = Field(gt=0)
    subtotal: Decimal


class OrderCreate(BaseModel):
    shop_id: int
    total: Decimal
    payment_method: str
    items: list[OrderItemCreate]


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product_name: str
    price: Decimal
    quantity: int
    subtotal: Decimal


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    shop_id: int
    total: Decimal
    payment_method: str
    created_at: datetime
    items: list[OrderItemResponse]